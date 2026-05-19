import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";

export default async function AuditLogPage() {
  await requireRole("SUPER_ADMIN");

  const logs = await prisma.auditLog.findMany({
    where: { archivedAt: null },
    include: {
      performedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = logs.map((l) => ({
    ...l,
    metadata: l.metadata as Record<string, unknown> | null,
    archivedAt: l.archivedAt?.toISOString() || null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-deep">Audit Log</h2>
        <p className="text-neutral-muted text-sm mt-1">Showing last 12 months. Records archived for 5 years.</p>
      </div>
      <AuditLogViewer logs={serialized} />
    </div>
  );
}
