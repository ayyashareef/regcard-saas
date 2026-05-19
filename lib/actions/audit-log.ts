"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

/**
 * Active audit-log entries (not yet archived) for the caller's tenant,
 * newest first. SUPER_ADMIN only — mirrors the v1 /admin/audit-log gate.
 */
export async function getAuditLog(limit = 100) {
  const { session, orgId } = await requireTenant();
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");

  return prisma.auditLog.findMany({
    where: { orgId, archivedAt: null },
    include: { performedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
