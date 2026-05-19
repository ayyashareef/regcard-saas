import { requireRole } from "@/lib/auth/session";
import { getAuditLog } from "@/lib/actions/audit-log";
import { AuditView } from "@/components/v2/audit/audit-view";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole("SUPER_ADMIN");
  const entries = await getAuditLog(100);
  return <AuditView entries={entries} />;
}
