import type { AuditLog } from "@prisma/client";
import type { AuditAction } from "@/lib/enums";
import { PageHeaderV2 } from "@/components/v2/page-header";

type Row = AuditLog & { performedBy: { name: string; email: string } | null };

interface Props {
  entries: Row[];
}

/** Action enum → human label + tag colour bucket. */
function actionMeta(a: AuditAction): { label: string; cls: string } {
  const map: Record<AuditAction, { label: string; cls: string }> = {
    USER_LOGIN: { label: "Login", cls: "tag-green" },
    USER_LOGOUT: { label: "Logout", cls: "tag-grey" },
    USER_CREATED: { label: "User created", cls: "tag-violet" },
    USER_UPDATED: { label: "User updated", cls: "tag-violet" },
    USER_DEACTIVATED: { label: "User deactivated", cls: "tag-rose" },
    ROOM_CREATED: { label: "Room created", cls: "tag-sky" },
    ROOM_UPDATED: { label: "Room updated", cls: "tag-sky" },
    ROOM_DELETED: { label: "Room deleted", cls: "tag-rose" },
    REG_CARD_CREATED: { label: "Card created", cls: "tag-green" },
    REG_CARD_UPDATED: { label: "Card updated", cls: "tag-amber" },
    REG_CARD_DELETED: { label: "Card deleted", cls: "tag-rose" },
    REG_CARD_PDF_DOWNLOADED: { label: "PDF downloaded", cls: "tag-grey" },
    EXTENSION_REQUESTED: { label: "Extension requested", cls: "tag-amber" },
    EXTENSION_APPROVED: { label: "Extension approved", cls: "tag-green" },
    EXTENSION_REJECTED: { label: "Extension rejected", cls: "tag-rose" },
  };
  return map[a] ?? { label: String(a), cls: "tag-grey" };
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d);
}
function renderDetails(meta: unknown): string | null {
  if (meta == null || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  if (Array.isArray(m.changed)) return `changed · ${(m.changed as unknown[]).join(", ")}`;
  if (typeof m.source === "string") return `source · ${m.source}`;
  const keys = Object.keys(m);
  if (keys.length === 0) return null;
  return keys.map((k) => `${k} · ${String(m[k])}`).join("  ·  ");
}

export function AuditView({ entries }: Props) {
  return (
    <div className="page">
      <PageHeaderV2
        eyebrow="Insight · System"
        title="Audit log"
        subtitle="The most recent operator activity. Records are archived for retention review."
      />

      <div className="panel">
        <div className="panel-h">
          <div className="panel-h-l"><div className="panel-h-t">Activity</div><div className="panel-h-m">latest {entries.length}</div></div>
        </div>
        {entries.length === 0 ? (
          <div className="empty-state">No audit-log entries.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 860 }}>
              <thead>
                <tr><th style={{ width: 90 }}>Time</th><th>Action</th><th>Entity</th><th>Label</th><th>By</th><th>Details</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const am = actionMeta(e.action as AuditAction);
                  const details = renderDetails(e.metadata);
                  return (
                    <tr key={e.id}>
                      <td className="mono subtle" style={{ whiteSpace: "nowrap" }}>
                        {fmtTime(e.createdAt)}
                        <span style={{ display: "block", fontSize: 10, color: "var(--ink-mute)" }}>{fmtDate(e.createdAt)}</span>
                      </td>
                      <td><span className={`tag ${am.cls}`}><span className="ddot"/> {am.label}</span></td>
                      <td><span className="tbl-cc-flag">{e.entity}</span></td>
                      <td className="mono subtle">{e.entityLabel || "—"}</td>
                      <td>{e.performedBy?.name ?? "—"}</td>
                      <td>{details ? <code className="mono" style={{ fontSize: 11, background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4, color: "var(--ink-2)" }}>{details}</code> : <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
