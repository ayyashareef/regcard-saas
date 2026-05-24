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
  { key: "IN_HOUSE", label: "In house" },
  { key: "PENDING", label: "Awaiting" },
  { key: "CHECKED_IN", label: "Checked in" },
];

const TONES = ["#0ea5e9", "#84cc16", "#f97316", "#a855f7", "#ec4899", "#06b6d4", "#14b8a6"];
function tone(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; }
function initials(name: string | null) {
  if (!name) return "—";
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function rowStatus(c: Row): "in" | "awaiting" | "out" {
  if (isStayOver(c)) return "out";
  if (c.checkInTime) return "in";
  return "awaiting";
}
const STATUS_TAG = {
  in: { label: "Checked in", cls: "tag-green" },
  awaiting: { label: "Awaiting", cls: "tag-amber" },
  out: { label: "Departed", cls: "tag-grey" },
} as const;

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}
function buildHref(params: { q?: string; status?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `/reg-cards?${s}` : "/reg-cards";
}

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

export function RegCardsView({ cards, total, page, limit, q, status }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="page">
      <PageHeaderV2
        eyebrow="Operations · Records"
        title="Reg cards"
        actions={
          <HeaderButton href="/reg-cards/new" variant="primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New card
          </HeaderButton>
        }
      />

      {/* Filters */}
      <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
        <form method="get" className="search">
          {status && <input type="hidden" name="status" value={status} />}
          {SEARCH_ICON}
          <input name="q" defaultValue={q} placeholder="Search by name, card no, or ID…" aria-label="Search reg cards" />
        </form>
        <div className="seg">
          {STATUS_FILTERS.map((f) => (
            <Link key={f.key || "all"} href={buildHref({ q, status: f.key })} className={status === f.key ? "on" : ""}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Panel */}
      <div className="panel">
        <div className="panel-h">
          <div className="panel-h-l">
            <div className="panel-h-t">Records</div>
            <div className="panel-h-m">{from}–{to} of {total}</div>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="empty-state">No registration cards match this view.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Card no</th><th>Guest</th><th>Room</th><th>Arrival</th><th>Departure</th><th>Status</th><th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => {
                  const st = rowStatus(c);
                  const nights = nightsBetween(c.arrivalDate, c.departureDate);
                  return (
                    <tr key={c.id}>
                      <td className="mono subtle"><Link href={`/reg-cards/${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>{c.cardNo}</Link></td>
                      <td>
                        <div className="tbl-name-cell">
                          <span className="avt avt-sq" style={{ background: tone(c.id) }}>{initials(c.guestName)}</span>
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/reg-cards/${c.id}`} className="tbl-name" style={{ textDecoration: "none" }}>{c.guestName || "Unnamed guest"}</Link>
                            {c.idNumber && <div className="tbl-sub">{c.idType} · {c.idNumber}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{c.room?.number || "—"}{c.room?.type && <span className="subtle" style={{ marginLeft: 6, fontSize: 11 }}>{c.room.type}</span>}</td>
                      <td className="mono subtle">{fmtDate(c.arrivalDate)}</td>
                      <td className="mono subtle">{fmtDate(c.departureDate)}{nights !== null && <span style={{ marginLeft: 6 }}>· {nights}n</span>}</td>
                      <td><span className={`tag ${STATUS_TAG[st].cls}`}><span className="ddot"/> {STATUS_TAG[st].label}</span></td>
                      <td><div className="tbl-row-action" style={{ opacity: 1 }}><Link href={`/reg-cards/${c.id}`} className="tbl-action">View</Link></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="panel-h" style={{ borderBottom: "none", borderTop: "1px solid var(--border-faint)", justifyContent: "space-between" }}>
            <span className="panel-h-m">Page {page} of {totalPages}</span>
            <div className="row" style={{ gap: 6 }}>
              {page > 1 && <Link href={buildHref({ q, status, page: page - 1 })} className="btn ghost sm">‹ Prev</Link>}
              {page < totalPages && <Link href={buildHref({ q, status, page: page + 1 })} className="btn ghost sm">Next ›</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
