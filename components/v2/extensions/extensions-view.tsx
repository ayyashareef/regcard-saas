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

function initials(name: string | null | undefined) {
  if (!name) return "??";
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
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
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}
function nights(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

const STAT_LABEL: React.CSSProperties = { fontSize: 9.5, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-text-soft)", fontWeight: 600 };
const STAT_VALUE: React.CSSProperties = { fontSize: 14, color: "var(--color-ink-2)", fontWeight: 600, lineHeight: 1.3 };

export function ExtensionsView({ pending, reviewedCount }: Props) {
  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <PageHeaderV2
        eyebrow="Pending review"
        title="Stay extensions"
        subtitle={`${pending.length} request${pending.length === 1 ? "" : "s"} awaiting approval${reviewedCount > 0 ? ` · ${reviewedCount} reviewed all-time` : ""}.`}
      />

      {pending.length === 0 ? (
        <div className="text-center" style={{ padding: "56px 22px", color: "var(--color-text-soft)", fontSize: 13, background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 12 }}>
          No pending extension requests. You&apos;re all caught up.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((r) => {
            const rc = r.regCard;
            const idLine = [rc?.cardNo, rc?.nationality, rc?.idNumber ? `${rc.idType} ${rc.idNumber}` : null].filter(Boolean).join(" · ");
            const curNights = nights(rc?.arrivalDate ?? null, rc?.departureDate ?? null);
            const newNights = nights(rc?.arrivalDate ?? null, r.newDepartureDate ?? null);
            const delta = curNights != null && newNights != null ? newNights - curNights : null;
            return (
              <div key={r.id} style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 12, overflow: "hidden" }}>
                {/* head */}
                <div className="flex flex-wrap items-start justify-between gap-3" style={{ padding: "18px 20px", borderBottom: "1px solid var(--color-line)" }}>
                  <div className="flex items-center gap-3.5">
                    <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(150deg,#f3e2b3,#b8893b)", color: "var(--color-ink-2)", fontSize: 14, fontWeight: 700 }}>{initials(rc?.guestName)}</div>
                    <div className="min-w-0">
                      <div style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: 16 }} className="truncate">{rc?.guestName || "Unknown guest"}</div>
                      {idLine && <div className="font-mono" style={{ fontSize: 10.5, color: "var(--color-text-soft)", letterSpacing: ".04em" }}>{idLine}</div>}
                    </div>
                  </div>
                  <div className="font-mono text-right" style={{ fontSize: 12.5, color: "var(--color-ink-2)", fontWeight: 600, letterSpacing: ".04em" }}>
                    Requested {fmtTime(r.createdAt)}
                    <small style={{ display: "block", fontWeight: 500, color: "var(--color-text-soft)", fontSize: 11, letterSpacing: ".06em" }}>{ago(r.createdAt)}</small>
                  </div>
                </div>
                {/* body */}
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3" style={{ padding: "20px", borderBottom: "1px solid var(--color-line)" }}>
                  <div className="flex flex-col gap-1.5">
                    <span style={STAT_LABEL}>Room</span>
                    <b style={STAT_VALUE}>{rc?.room?.number ? `${rc.room.number}${rc.room.type ? ` · ${rc.room.type}` : ""}` : "—"}</b>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span style={STAT_LABEL}>Current stay</span>
                    <b style={STAT_VALUE}>
                      {fmtDate(rc?.arrivalDate ?? null)} → {fmtDate(rc?.departureDate ?? null)}
                      {curNights != null && <small style={{ display: "block", fontSize: 11.5, color: "var(--color-text-soft)", marginTop: 2, fontWeight: 500 }}>{curNights} night{curNights === 1 ? "" : "s"}</small>}
                    </b>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span style={STAT_LABEL}>Requested change</span>
                    <b style={{ ...STAT_VALUE, color: "var(--color-brand-deep)" }}>
                      {r.newDepartureDate ? `to ${fmtDate(r.newDepartureDate)}` : r.newCheckoutTime ? `checkout @ ${r.newCheckoutTime}` : "—"}
                      {(delta != null || r.newCheckoutTime) && (
                        <small style={{ display: "block", fontSize: 11.5, color: "var(--color-text-soft)", marginTop: 2, fontWeight: 500 }}>
                          {delta != null ? `${delta >= 0 ? "+" : ""}${delta} night${Math.abs(delta) === 1 ? "" : "s"}` : `new checkout time`}
                        </small>
                      )}
                    </b>
                  </div>
                </div>
                {/* foot */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ padding: "16px 20px", background: "rgba(184,137,59,.04)" }}>
                  <div style={{ fontSize: 13, color: "var(--color-neutral-text)", fontStyle: r.note ? "italic" : "normal", lineHeight: 1.4 }}>
                    {r.note ? (
                      <>
                        <b style={{ color: "var(--color-ink-2)", fontStyle: "normal", fontWeight: 600, marginRight: 6 }}>Guest note:</b>
                        {r.note}
                      </>
                    ) : (
                      <span style={{ color: "var(--color-text-soft)" }}>No note · requested by {r.requestedBy?.name ?? "staff"}</span>
                    )}
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
