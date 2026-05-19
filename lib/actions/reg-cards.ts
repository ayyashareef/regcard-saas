"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import {
  regCardCreateSchema,
  regCardUpdateSchema,
  toPrismaData,
} from "@/lib/validators/reg-card";

// Card numbers are sequential PER TENANT (the unique is on [orgId, cardNo]),
// so the scan for the last number must be org-scoped and use the org's prefix.
export async function generateCardNo(
  orgId: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  const lastCard = await prisma.regCard.findFirst({
    where: { orgId, cardNo: { startsWith: fullPrefix } },
    orderBy: { cardNo: "desc" },
  });

  let nextNum = 1;
  if (lastCard) {
    const lastNum = parseInt(lastCard.cardNo.slice(-5));
    nextNum = lastNum + 1;
  }

  return `${fullPrefix}${String(nextNum).padStart(5, "0")}`;
}

export async function createRegCard(data: unknown) {
  const { session, orgId } = await requireTenant();

  const parsed = regCardCreateSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.issues[0]?.message ?? "validation failed"}`);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { cardNoPrefix: true },
  });
  const cardNo = await generateCardNo(orgId, org?.cardNoPrefix ?? "UG");
  const prismaData = toPrismaData(parsed.data);

  const regCard = await prisma.regCard.create({
    data: {
      orgId,
      cardNo,
      idType: "TOURIST",
      ...prismaData,
      date: (prismaData.date as Date | null | undefined) ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "REG_CARD_CREATED",
      entity: "REG_CARD",
      entityId: regCard.id,
      entityLabel: cardNo,
      performedById: session.user.id,
    },
  });

  revalidatePath("/reg-cards");
  return regCard;
}

export async function updateRegCard(id: string, data: unknown) {
  const { session, orgId } = await requireTenant();

  const parsed = regCardUpdateSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.issues[0]?.message ?? "validation failed"}`);
  }

  // Scope the existence check to the tenant so a foreign id can't be edited.
  const existing = await prisma.regCard.findFirst({ where: { id, orgId } });
  if (!existing) throw new Error("Not found");

  const updateData = toPrismaData(parsed.data);

  const regCard = await prisma.regCard.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "REG_CARD_UPDATED",
      entity: "REG_CARD",
      entityId: regCard.id,
      entityLabel: regCard.cardNo,
      performedById: session.user.id,
      metadata: { changed: Object.keys(updateData) },
    },
  });

  revalidatePath("/reg-cards");
  revalidatePath(`/reg-cards/${id}`);
  return regCard;
}

export async function deleteRegCard(id: string) {
  const { session, orgId } = await requireTenant();
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  const regCard = await prisma.regCard.findFirst({ where: { id, orgId } });
  if (!regCard) throw new Error("Not found");

  await prisma.extensionRequest.deleteMany({ where: { regCardId: id, orgId } });
  await prisma.regCard.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "REG_CARD_DELETED",
      entity: "REG_CARD",
      entityId: id,
      entityLabel: regCard.cardNo,
      performedById: session.user.id,
    },
  });

  revalidatePath("/reg-cards");
}

export async function getRegCards(params?: {
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  status?: string;
}) {
  const { orgId } = await requireTenant();

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  // Every query starts tenant-scoped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [{ orgId }];

  if (params?.search) {
    const q = params.search.trim();
    // `mode: "insensitive"` is a PostgreSQL-only filter option — passing it to a
    // SQLite datasource throws PrismaClientValidationError. SQLite's LIKE is
    // already case-insensitive for ASCII, so just omit `mode` there.
    const ci =
      process.env.DATABASE_URL?.startsWith("file:")
        ? {}
        : ({ mode: "insensitive" } as const);
    conditions.push({
      OR: [
        { cardNo: { contains: q, ...ci } },
        { guestName: { contains: q, ...ci } },
        { idNumber: { contains: q, ...ci } },
      ],
    });
  }

  if (params?.status) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (params.status === "IN_HOUSE") {
      conditions.push({
        arrivalDate: { lte: tomorrow },
        departureDate: { gte: today },
      });
    }

    if (params.status === "PENDING") {
      conditions.push({
        checkInTime: null,
      });
    }

    if (params.status === "CHECKED_IN") {
      conditions.push({
        checkInTime: { not: null },
      });
    }
  }

  if (params?.from) {
    conditions.push({ date: { gte: new Date(params.from) } });
  }

  if (params?.to) {
    // Include the entire "to" day
    const toDate = new Date(params.to);
    toDate.setDate(toDate.getDate() + 1);
    conditions.push({ date: { lt: toDate } });
  }

  const where = { AND: conditions };

  const [regCards, total] = await Promise.all([
    prisma.regCard.findMany({
      where,
      include: { room: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.regCard.count({ where }),
  ]);

  return { regCards, total, page, limit };
}

export async function getRegCard(id: string) {
  const { orgId } = await requireTenant();
  return prisma.regCard.findFirst({
    where: { id, orgId },
    include: {
      room: true,
      extensionRequests: {
        include: { requestedBy: true, reviewedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function findReturningGuest(params: {
  idNumber?: string;
  guestName?: string;
  dateOfBirth?: string;
}) {
  const { orgId } = await requireTenant();

  if (params.idNumber) {
    const matches = await prisma.regCard.findMany({
      where: { orgId, idNumber: params.idNumber },
      orderBy: { createdAt: "desc" },
      include: { room: true },
    });
    if (matches.length > 0) {
      return {
        type: "definitive" as const,
        message: `Returning guest — ${matches.length} previous stay${matches.length > 1 ? "s" : ""}`,
        previousStays: matches,
      };
    }
  }

  if (params.guestName && params.dateOfBirth) {
    const matches = await prisma.regCard.findMany({
      where: {
        orgId,
        guestName: { contains: params.guestName },
        dateOfBirth: new Date(params.dateOfBirth),
      },
      orderBy: { createdAt: "desc" },
      include: { room: true },
    });
    if (matches.length > 0) {
      return {
        type: "possible" as const,
        message: "Possible returning guest — verify manually",
        previousStays: matches,
      };
    }
  }

  return null;
}
