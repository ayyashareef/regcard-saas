"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function createExtensionRequest(data: {
  regCardId: string;
  newCheckoutTime?: string;
  newDepartureDate?: string;
  note?: string;
}) {
  const { session, orgId } = await requireTenant();

  // The card must belong to the caller's tenant.
  const regCard = await prisma.regCard.findFirst({
    where: { id: data.regCardId, orgId },
  });
  if (!regCard) throw new Error("Registration card not found");

  const existing = await prisma.extensionRequest.findFirst({
    where: { regCardId: data.regCardId, orgId, status: "PENDING" },
  });
  if (existing) {
    throw new Error("There is already a pending extension request for this card");
  }

  const request = await prisma.extensionRequest.create({
    data: {
      orgId,
      regCardId: data.regCardId,
      requestedById: session.user.id,
      newCheckoutTime: data.newCheckoutTime || null,
      newDepartureDate: data.newDepartureDate
        ? new Date(data.newDepartureDate)
        : null,
      note: data.note || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "EXTENSION_REQUESTED",
      entity: "EXTENSION_REQUEST",
      entityId: request.id,
      entityLabel: regCard.cardNo,
      performedById: session.user.id,
    },
  });

  revalidatePath("/admin/checkout-extensions");
  revalidatePath(`/reg-cards/${data.regCardId}`);
  return request;
}

export async function getExtensionRequests() {
  const { orgId } = await requireTenant();

  return prisma.extensionRequest.findMany({
    where: { orgId },
    include: {
      regCard: { include: { room: true } },
      requestedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingExtensionCount() {
  const { orgId } = await requireTenant();
  return prisma.extensionRequest.count({ where: { orgId, status: "PENDING" } });
}

export async function reviewExtensionRequest(
  id: string,
  action: "APPROVED" | "REJECTED"
) {
  const { session, orgId } = await requireTenant();

  const request = await prisma.extensionRequest.findFirst({
    where: { id, orgId },
    include: { regCard: true },
  });

  if (!request) throw new Error("Not found");
  if (request.status !== "PENDING") throw new Error("Already reviewed");

  await prisma.extensionRequest.update({
    where: { id },
    data: {
      status: action,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  if (action === "APPROVED") {
    const updateData: Record<string, unknown> = {};
    if (request.newCheckoutTime) updateData.checkOutTime = request.newCheckoutTime;
    if (request.newDepartureDate) updateData.departureDate = request.newDepartureDate;

    await prisma.regCard.update({
      where: { id: request.regCardId },
      data: updateData,
    });
  }

  await prisma.auditLog.create({
    data: {
      orgId,
      action: action === "APPROVED" ? "EXTENSION_APPROVED" : "EXTENSION_REJECTED",
      entity: "EXTENSION_REQUEST",
      entityId: id,
      entityLabel: request.regCard.cardNo,
      performedById: session.user.id,
    },
  });

  revalidatePath("/admin/checkout-extensions");
  revalidatePath(`/reg-cards/${request.regCardId}`);
}
