import type { ExtensionRequest, RegCard, Room } from "@prisma/client";
import { PageHeaderV2 } from "@/components/v2/page-header";
import { ExtensionReviewButtons } from "./extension-review-buttons";

type ExtRow = ExtensionRequest & {
  regCard: (RegCard & { room: Room | null }) | null;
  requestedBy: { name: string; email: string } | null;
};

interface Props {
  pending: ExtRow[];
  reviewedCount: number;
}

const TONES = ["#0ea5e9", "#84cc16", "#f97316", "#a855f7", "#ec4899"];
function tone(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; }
function initials(name: string | null | undefined) {
  if (!name) return "—";
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
}
function ago(d: Date) {
  const min = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.round(hr / 24)} day(s) ago`;
}
function nights(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

const cell = { display: "flex", flexDirection: "column" as const, gap: 3 };
const label = { fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--ink-faint)", fontWeight: 600, fontFamily: "var(--font-mono)" };
const value = { fontSize: 13, color: "var(--ink)", fontWeight: 500 };

export function ExtensionsView({ pending, reviewedCount }: Props) {
  return (
    <div className="page">
      <PageHeaderV2
        eyebrow="Front desk · Pending"
        title="Stay extensions"
        subtitle={`${pending.length} request${pending.length === 1 ? "" : "s"} awaiting approval${reviewedCount > 0 ? ` · ${reviewedCount} reviewed all-time` : ""}.`}
      />

      {pending.length === 0 ? (
        <div className="panel"><div className="empty-state">No pending extension requests. You&apos;re all caught up.</div></div>
      ) : (
        <div className="col" style={{ gap: 12 }}>
          {pending.map((r) => {
            const rc = r.regCard;
            const idLine = [rc?.cardNo, rc?.nationality, rc?.idNumber ? `${rc.idType} ${rc.idNumber}` : null].filter(Boolean).join(" · ");
            const curNights = nights(rc?.arrivalDate ?? null, rc?.departureDate ?? null);
            const newNights = nights(rc?.arrivalDate ?? null, r.newDepartureDate ?? null);
            const delta = curNights != null && newNights != null ? newNights - curNights : null;
            return (
              <div key={r.id} className="panel">
                <div className="panel-h">
                  <div className="panel-h-l">
                    <span className="avt" style={{ width: 34, height: 34, fontSize: 12, background: tone(r.id) }}>{initials(rc?.guestName)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="tbl-name" style={{ fontSize: 14 }}>{rc?.guestName || "Unknown guest"}</div>
                      {idLine && <div className="tbl-sub">{idLine}</div>}
                    </div>
                  </div>
                  <div className="panel-h-m" style={{ textAlign: "right" }}>
                    Requested<br/>{ago(r.createdAt)}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", padding: 14, borderBottom: "1px solid var(--border-faint)" }}>
                  <div style={cell}><span style={label}>Room</span><b style={value}>{rc?.room?.number ? `${rc.room.number}${rc.room.type ? ` · ${rc.room.type}` : ""}` : "—"}</b></div>
                  <div style={cell}><span style={label}>Current stay</span><b style={value}>{fmtDate(rc?.arrivalDate ?? null)} → {fmtDate(rc?.departureDate ?? null)}{curNights != null && <span className="subtle" style={{ fontWeight: 400 }}> · {curNights}n</span>}</b></div>
                  <div style={cell}><span style={label}>Requested change</span><b style={{ ...value, color: "var(--accent)" }}>{r.newDepartureDate ? `to ${fmtDate(r.newDepartureDate)}` : r.newCheckoutTime ? `checkout @ ${r.newCheckoutTime}` : "—"}{delta != null && <span className="subtle" style={{ fontWeight: 400 }}> · {delta >= 0 ? "+" : ""}{delta}n</span>}</b></div>
                </div>

                <div className="row" style={{ justifyContent: "space-between", padding: 14, gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.4, flex: 1, minWidth: 200 }}>
                    {r.note
                      ? <><b style={{ color: "var(--ink-2)", fontWeight: 600, marginRight: 6 }}>Note:</b>{r.note}</>
                      : <span className="muted">No note · requested by {r.requestedBy?.name ?? "staff"}</span>}
                  </div>
                  <ExtensionReviewButtons requestId={r.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
