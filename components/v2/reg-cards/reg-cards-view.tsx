import Link from "next/link";
import type { RegCard, Room } from "@prisma/client";
import { PageHeaderV2, HeaderButton } from "@/components/v2/page-header";
import { isStayOver } from "@/lib/stay-status";

type Row = RegCard & { room: Room | null };

interface Props {
  cards: Row[];
  total: number;
  page: number;
  limit: number;
  q: string;
  status: string;
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "IN_HOUSE", label: "In House" },
  { key: "PENDING", label: "Awaiting" },
  { key: "CHECKED_IN", label: "Checked In" },
];

function initials(name: string | null) {
  if (!name) return "??";
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function rowStatus(c: Row): "in" | "awaiting" | "out" {
  // Shared predicate — see lib/stay-status.ts. The departure day itself still
  // counts as in-house; the card is only "Departed" once that day has passed.
  if (isStayOver(c)) return "out";
  if (c.checkInTime) return "in";
  return "awaiting";
}

const STATUS_META = {
  in: { label: "Checked in", bg: "rgba(63,122,74,.12)", color: "var(--color-status-green)" },
  awaiting: { label: "Awaiting", bg: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" },
  out: { label: "Departed", bg: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" },
} as const;

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function fmtTime(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}
function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  const n = Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
  return n;
}

function buildHref(params: { q?: string; status?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `/reg-cards?${s}` : "/reg-cards";
}

const TH: React.CSSProperties = {
  padding: "12px 20px",
  fontSize: 10.5,
  letterSpacing: ".16em",
  color: "var(--color-text-soft)",
  background: "rgba(184,137,59,.05)",
  fontWeight: 600,
  borderBottom: "1px solid var(--color-line)",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const TD: React.CSSProperties = {
  padding: "14px 20px",
  borderBottom: "1px solid var(--color-line)",
  verticalAlign: "middle",
};
const chip = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 14px",
  border: "1px solid var(--color-line)",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
  background: active ? "var(--color-ink-2)" : "#fff",
  color: active ? "#f5ecd2" : "var(--color-neutral-text)",
  borderColor: active ? "var(--color-ink-2)" : "var(--color-line)",
});

export function RegCardsView({ cards, total, page, limit, q, status }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <PageHeaderV2
        eyebrow="Operations · Records"
        title="Registration Cards"
        actions={
          <>
            <HeaderButton href="/reg-cards/new" variant="gold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New Card
            </HeaderButton>
          </>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form method="get" className="relative min-w-[240px] flex-1 sm:max-w-[420px]">
          {status && <input type="hidden" name="status" value={status} />}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#a39786", pointerEvents: "none" }}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, card no, or ID…"
            aria-label="Search reg cards"
            style={{ width: "100%", padding: "12px 14px 12px 38px", border: "1px solid var(--color-line)", borderRadius: 6, background: "#fff", fontSize: 13.5, color: "var(--color-neutral-text)", outline: "none" }}
          />
        </form>
        <div className="flex flex-wrap items-center gap-2.5">
          {STATUS_FILTERS.map((f) => (
            <Link key={f.key || "all"} href={buildHref({ q, status: f.key })} style={chip(status === f.key)}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Panel */}
      <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10, overflow: "hidden" }}>
        <div
          className="flex flex-wrap items-center justify-between gap-2"
          style={{ padding: "14px 22px", borderBottom: "1px solid var(--color-line)", fontSize: 12.5, color: "var(--color-text-soft)" }}
        >
          <span>
            Showing <b style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{from}–{to}</b> of{" "}
            <b style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{total}</b> cards · sorted by <b>created ↓</b>
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="text-center" style={{ padding: "56px 22px", color: "var(--color-text-soft)", fontSize: 13 }}>
            No registration cards match this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Card No", "Guest", "Room", "Arrival", "Departure", "Status", ""].map((h, i) => (
                    <th key={i} style={{ ...TH, textAlign: i === 6 ? "right" : "left" }} className="font-mono uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => {
                  const st = rowStatus(c);
                  const nights = nightsBetween(c.arrivalDate, c.departureDate);
                  return (
                    <tr key={c.id}>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-ink-2)", fontWeight: 500 }} className="font-mono">
                        <Link href={`/reg-cards/${c.id}`} className="hover:underline">{c.cardNo}</Link>
                      </td>
                      <td style={TD}>
                        <div className="flex items-center gap-2.5">
                          <div className="grid place-items-center" style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--color-ink-2)", color: "#f5ecd2", fontSize: 11, fontWeight: 600 }}>{initials(c.guestName)}</div>
                          <div className="min-w-0">
                            <div style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: 13 }} className="truncate">{c.guestName || "—"}</div>
                            {c.idNumber && <div className="font-mono truncate" style={{ fontSize: 10.5, color: "var(--color-text-soft)", letterSpacing: ".04em" }}>{c.idType} · {c.idNumber}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={TD}>
                        <span className="font-mono" style={{ fontSize: 12.5, color: "var(--color-ink-2)", fontWeight: 600 }}>{c.room?.number || "—"}</span>
                        {c.room?.type && <span className="uppercase" style={{ fontSize: 10.5, fontWeight: 500, color: "var(--color-text-soft)", letterSpacing: ".06em", marginLeft: 8 }}>{c.room.type}</span>}
                      </td>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-ink-2)" }} className="font-mono">
                        {fmtDate(c.arrivalDate)}
                        {(c.checkInTime || c.arrivalDate) && <small style={{ display: "block", fontSize: 10.5, color: "var(--color-text-soft)", marginTop: 2 }}>{c.checkInTime || fmtTime(c.arrivalDate)}</small>}
                      </td>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-ink-2)" }} className="font-mono">
                        {fmtDate(c.departureDate)}
                        {nights !== null && <small style={{ display: "block", fontSize: 10.5, color: "var(--color-text-soft)", marginTop: 2 }}>{nights} night{nights === 1 ? "" : "s"}</small>}
                      </td>
                      <td style={TD}>
                        <span className="inline-flex items-center gap-1.5" style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", background: STATUS_META[st].bg, color: STATUS_META[st].color }}>
                          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                          {STATUS_META[st].label}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link href={`/reg-cards/${c.id}`} className="font-mono uppercase hover:underline" style={{ fontSize: 10.5, letterSpacing: ".12em", color: "var(--color-brand-deep)", fontWeight: 600, textDecoration: "none" }}>View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: "14px 22px", borderTop: "1px solid var(--color-line)", fontSize: 12.5, color: "var(--color-text-soft)" }}>
            <span>Page <b style={{ color: "var(--color-ink-2)" }}>{page}</b> of {totalPages}</span>
            <div className="flex flex-wrap gap-1.5">
              {page > 1 && <Link href={buildHref({ q, status, page: page - 1 })} style={{ ...chip(false), padding: "6px 12px" }}>‹ Prev</Link>}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "6px 4px", color: "var(--color-text-soft)" }}>…</span>}
                    <Link href={buildHref({ q, status, page: p })} style={{ ...chip(p === page), padding: "6px 12px" }}>{p}</Link>
                  </span>
                ))}
              {page < totalPages && <Link href={buildHref({ q, status, page: page + 1 })} style={{ ...chip(false), padding: "6px 12px" }}>Next ›</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
