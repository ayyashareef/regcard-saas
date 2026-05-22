"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

async function assertPlatformAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

/** All tenant organizations with row counts. PLATFORM_ADMIN only. */
export async function listOrganizations() {
  await requirePlatformAdmin();
  return prisma.organization.findMany({
    where: { slug: { not: "_platform" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      createdAt: true,
      _count: { select: { users: true, regCards: true, rooms: true } },
    },
  });
}

/** Suspend or reactivate a tenant. A suspended org cannot log in or load. */
export async function setOrgStatus(orgId: string, status: "ACTIVE" | "SUSPENDED") {
  await assertPlatformAdmin();

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Not found");
  if (org.slug === "_platform") throw new Error("Cannot change the platform org");

  await prisma.organization.update({ where: { id: orgId }, data: { status } });
  revalidatePath("/platform");
}
