import type { AuditLog } from "@prisma/client";
import type { AuditAction } from "@/lib/enums";
import { PageHeaderV2 } from "@/components/v2/page-header";

type Row = AuditLog & { performedBy: { name: string; email: string } | null };

interface Props {
  entries: Row[];
}

/** Action enum → human label + pill colour bucket. */
function actionMeta(a: AuditAction): { label: string; bg: string; color: string } {
  const green = { bg: "rgba(63,122,74,.12)", color: "var(--color-status-green)" };
  const gold = { bg: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" };
  const red = { bg: "rgba(164,74,58,.12)", color: "var(--color-status-red)" };
  const muted = { bg: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" };
  const map: Record<AuditAction, { label: string } & typeof green> = {
    USER_LOGIN: { label: "Login", ...green },
    USER_LOGOUT: { label: "Logout", ...muted },
    USER_CREATED: { label: "User created", ...gold },
    USER_UPDATED: { label: "User updated", ...gold },
    USER_DEACTIVATED: { label: "User deactivated", ...red },
    ROOM_CREATED: { label: "Room created", ...gold },
    ROOM_UPDATED: { label: "Room updated", ...gold },
    ROOM_DELETED: { label: "Room deleted", ...red },
    REG_CARD_CREATED: { label: "Card created", ...green },
    REG_CARD_UPDATED: { label: "Card updated", ...gold },
    REG_CARD_DELETED: { label: "Card deleted", ...red },
    REG_CARD_PDF_DOWNLOADED: { label: "PDF downloaded", ...muted },
    EXTENSION_REQUESTED: { label: "Extension requested", ...gold },
    EXTENSION_APPROVED: { label: "Extension approved", ...green },
    EXTENSION_REJECTED: { label: "Extension rejected", ...red },
  };
  return map[a] ?? { label: String(a), ...muted };
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

const TH: React.CSSProperties = {
  padding: "12px 18px",
  fontSize: 10.5,
  letterSpacing: ".16em",
  color: "var(--color-text-soft)",
  background: "rgba(184,137,59,.05)",
  fontWeight: 600,
  borderBottom: "1px solid var(--color-line)",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const TD: React.CSSProperties = { padding: "14px 18px", borderBottom: "1px solid var(--color-line)", verticalAlign: "middle" };

export function AuditView({ entries }: Props) {
  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <PageHeaderV2
        eyebrow="System · Records"
        title="Audit log"
        subtitle="Showing the most recent activity. Records are archived for 5 years per the retention policy."
      />

      <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10, overflow: "hidden" }}>
        {entries.length === 0 ? (
          <div className="text-center" style={{ padding: "56px 22px", color: "var(--color-text-soft)", fontSize: 13 }}>
            No audit-log entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", minWidth: 880, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Time", "Action", "Entity", "Label", "Performed by", "Details"].map((h) => (
                    <th key={h} style={TH} className="font-mono uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const am = actionMeta(e.action as AuditAction);
                  const details = renderDetails(e.metadata);
                  return (
                    <tr key={e.id}>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-ink-2)", whiteSpace: "nowrap" }} className="font-mono">
                        {fmtDate(e.createdAt)}
                        <small style={{ display: "block", fontSize: 10.5, color: "var(--color-text-soft)", marginTop: 2 }}>{fmtTime(e.createdAt)}</small>
                      </td>
                      <td style={TD}>
                        <span className="inline-flex items-center gap-1.5" style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11.5, fontWeight: 600, letterSpacing: ".02em", background: am.bg, color: am.color, whiteSpace: "nowrap" }}>
                          <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                          {am.label}
                        </span>
                      </td>
                      <td style={TD}>
                        <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: ".18em", fontWeight: 600, padding: "3px 8px", border: "1px solid var(--color-line-2)", borderRadius: 4, color: "var(--color-text-soft)", background: "#fff", whiteSpace: "nowrap" }}>{e.entity}</span>
                      </td>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-ink-2)" }} className="font-mono">{e.entityLabel || "—"}</td>
                      <td style={{ ...TD, fontSize: 13, color: "var(--color-ink-2)" }}>{e.performedBy?.name ?? "—"}</td>
                      <td style={TD}>
                        {details ? (
                          <code className="font-mono" style={{ fontSize: 11.5, background: "rgba(26,41,66,.06)", padding: "3px 8px", borderRadius: 4, color: "var(--color-ink-2)", letterSpacing: ".02em" }}>{details}</code>
                        ) : (
                          <span style={{ color: "var(--color-text-soft)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono uppercase" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--color-text-soft)" }}>
        Showing the latest {entries.length} entries · older records archived for 5 years
      </p>
    </div>
  );
}
