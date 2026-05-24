"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrgPath } from "@/components/org-context";

interface Arrival {
  id: string; cardNo: string; name: string; initials: string; tone: string;
  country: string; doc: string; room: string; eta: string; nights: number | null;
}
interface Recent {
  id: string; cardNo: string; name: string; initials: string; tone: string; room: string; created: string;
}
interface Activity {
  id: string; t: string; who: string; verb: string; obj: string; tag: string; tone: string;
}
interface Props {
  orgName: string;
  isAdmin: boolean;
  kpis: { checkInsToday: number; expected: number; inHouse: number; occupancyPct: number; totalRooms: number; roomsOccupied: number; pending: number };
  occupancy: { total: number; occupied: number; available: number; cleaning: number; outOfOrder: number; pct: number };
  arrivals: Arrival[];
  recent: Recent[];
  activity: Activity[];
}

/* ── tiny icons ── */
const Ico = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  room: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9h20v12H2z"/><path d="M6 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>,
  log: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

function sparkPath(seed: number, w = 64, h = 22) {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pts = 16;
  const ys = Array.from({ length: pts }, () => 0.2 + rand() * 0.7);
  const sm = ys.map((y, i) => (ys[Math.max(0, i - 1)] + y + ys[Math.min(ys.length - 1, i + 1)]) / 3);
  return sm.map((y, i) => `${i === 0 ? "M" : "L"}${((i / (pts - 1)) * w).toFixed(1)},${(h - y * h).toFixed(1)}`).join(" ");
}
function Spark({ seed, color }: { seed: number; color: string }) {
  const w = 64, h = 22, p = sparkPath(seed, w, h), id = `sp${seed}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ flexShrink: 0 }}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={`${p} L${w},${h} L0,${h} Z`} fill={`url(#${id})`}/>
      <path d={p} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Kpi({ label, value, unit, delta, deltaTone = "grey", seed, color }: {
  label: string; value: React.ReactNode; unit?: string; delta?: string; deltaTone?: string; seed?: number; color?: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-row">
        <div className="kpi-val"><span className="kpi-num">{value}</span>{unit && <span className="kpi-unit">{unit}</span>}</div>
        {seed != null && color && <Spark seed={seed} color={color}/>}
      </div>
      {delta && <div className={`kpi-delta tone-${deltaTone}`}>{delta}</div>}
    </div>
  );
}

const START = 6, END = 22;
function trackLeft(eta: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(eta);
  if (!m) return null;
  const t = Number(m[1]) + Number(m[2]) / 60;
  if (t < START || t > END) return null;
  return ((t - START) / (END - START)) * 100;
}

export function DenseDashboard({ orgName, isAdmin, kpis, occupancy, arrivals, recent, activity }: Props) {
  const op = useOrgPath();
  const [tab, setTab] = useState<"arrivals" | "recent">("arrivals");

  const occ = occupancy;
  const pctOf = (n: number) => (occ.total > 0 ? (n / occ.total) * 100 : 0);

  return (
    <div className="dash">
      <style>{DASH_CSS}</style>

      {/* page header */}
      <div className="ph">
        <div className="ph-l">
          <div className="ph-eyebrow">
            <span>{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date())}</span>
            <span className="dot"/>
            <span>{kpis.expected} expected arrivals</span>
            <span className="dot"/>
            <span>{kpis.occupancyPct}% occupancy</span>
          </div>
          <h1 className="ph-h">Dashboard <span>· {orgName}</span></h1>
        </div>
        <div className="ph-actions">
          <button className="btn ghost sm">{Ico.eye} Today</button>
          <button className="btn ghost sm">{Ico.cal} Next 7 days</button>
          <Link href={op("/reg-cards/new")} className="btn primary">{Ico.plus} New card <span className="kbd" style={{ marginLeft: 4, background: "rgba(255,255,255,0.15)", borderColor: "transparent", color: "rgba(255,255,255,0.85)" }}>⌘N</span></Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        <Kpi label="Check-ins today" value={kpis.checkInsToday} unit={`/ ${kpis.expected} exp`} delta="today" seed={11} color="var(--color-brand)"/>
        <Kpi label="In-house" value={kpis.inHouse} unit="guests" delta="active" seed={22} color="var(--sky)"/>
        <Kpi label="Occupancy" value={kpis.occupancyPct} unit="%" delta={`${kpis.roomsOccupied} of ${kpis.totalRooms}`} deltaTone="green" seed={33} color="var(--green)"/>
        <Kpi label="Rooms" value={kpis.totalRooms} unit="active" delta={`${occ.available} available`} seed={44} color="var(--amber)"/>
        <Kpi label="Pending actions" value={kpis.pending} unit="items" delta={kpis.pending > 0 ? "needs review" : "all clear"} deltaTone={kpis.pending > 0 ? "amber" : "green"}/>
      </div>

      {/* timeline */}
      <div className="track-wrap">
        <div className="track-head">
          <div className="track-title">Today&apos;s timeline <span className="meta">06:00 → 22:00</span></div>
          <div className="track-legend">
            <span><i className="b" style={{ background: "var(--rose)" }}/> now</span>
            <span><i className="b" style={{ background: "var(--color-brand)" }}/> arrival</span>
          </div>
        </div>
        <Track arrivals={arrivals}/>
      </div>

      {/* main grid */}
      <div className="dgrid">
        {/* Movement */}
        <div className="panel">
          <div className="panel-h">
            <div className="panel-h-l">
              <div className="panel-h-t">Movement</div>
              <div className="tabs">
                <button className={`tab ${tab === "arrivals" ? "on" : ""}`} onClick={() => setTab("arrivals")}>Arrivals <span className="tab-count">{arrivals.length}</span></button>
                <button className={`tab ${tab === "recent" ? "on" : ""}`} onClick={() => setTab("recent")}>Recent <span className="tab-count">{recent.length}</span></button>
              </div>
            </div>
            <div className="panel-h-r"><Link href={op("/reg-cards")} className="btn soft sm">Open in records {Ico.arrow}</Link></div>
          </div>

          {tab === "arrivals" ? (
            arrivals.length === 0 ? (
              <div className="empty">No arrivals today.</div>
            ) : (
              <table className="tbl">
                <thead><tr><th style={{ width: 56 }}>ETA</th><th>Guest</th><th>Document</th><th>Room</th><th style={{ textAlign: "right" }}>Nts</th><th style={{ width: 120 }}></th></tr></thead>
                <tbody>
                  {arrivals.map((a) => (
                    <tr key={a.id}>
                      <td className="mono" style={{ fontWeight: 500 }}>{a.eta}</td>
                      <td>
                        <div className="tbl-name-cell">
                          <span className="avt avt-sq" style={{ background: a.tone }}>{a.initials}</span>
                          <div><div className="tbl-name">{a.name}</div><div className="tbl-sub"><span className="tbl-cc-flag">{a.country}</span> · {a.cardNo}</div></div>
                        </div>
                      </td>
                      <td className="mono subtle">{a.doc}</td>
                      <td>{a.room}</td>
                      <td className="num" style={{ textAlign: "right" }}>{a.nights ?? "—"}</td>
                      <td><div className="tbl-row-action"><Link href={op(`/reg-cards/${a.id}`)} className="tbl-action">View</Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : recent.length === 0 ? (
            <div className="empty">No cards yet.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Card</th><th>Guest</th><th>Room</th><th>Created</th></tr></thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td className="mono subtle">{c.cardNo}</td>
                    <td>
                      <div className="tbl-name-cell">
                        <span className="avt avt-sq" style={{ background: c.tone }}>{c.initials}</span>
                        <Link href={op(`/reg-cards/${c.id}`)} className="tbl-name" style={{ textDecoration: "none" }}>{c.name}</Link>
                      </div>
                    </td>
                    <td>{c.room}</td>
                    <td className="mono subtle">{c.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* side column */}
        <div className="side-col">
          {/* needs attention */}
          <div className="panel att">
            <div className="att-h"><span className="att-h-pulse"/> Needs attention <span className="muted" style={{ fontWeight: 400 }}>· {kpis.pending}</span></div>
            <div className="att-list">
              {kpis.pending > 0 ? (
                <Link href={op("/extensions")} className="att-item" style={{ textDecoration: "none" }}>
                  <div className="att-item-l">
                    <span className="tag tag-amber"><span className="ddot"/> Extension</span>
                    <div><div className="att-item-t">{kpis.pending} extension request{kpis.pending > 1 ? "s" : ""} pending</div><div className="att-item-m">Review and approve or decline</div></div>
                  </div>
                  <span className="att-item-r">→</span>
                </Link>
              ) : (
                <div className="att-item" style={{ cursor: "default" }}>
                  <div className="att-item-l">
                    <span className="tag tag-green"><span className="ddot"/> Clear</span>
                    <div><div className="att-item-t">Nothing needs attention</div><div className="att-item-m">All requests handled</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* occupancy */}
          <div className="panel">
            <div className="panel-h">
              <div className="panel-h-l"><div className="panel-h-t">Occupancy</div><div className="panel-h-m">{occ.total} rooms</div></div>
              <Link href={op("/rooms")} className="btn soft sm">Board {Ico.arrow}</Link>
            </div>
            <div className="occ">
              <div className="occ-row1"><div className="occ-big">{occ.pct}<span>%</span></div><div className="occ-fill">{occ.occupied} of {occ.total} occupied</div></div>
              <div className="occ-bar">
                <i style={{ width: `${pctOf(occ.occupied)}%`, background: "var(--color-brand)" }}/>
                <i style={{ width: `${pctOf(occ.available)}%`, background: "var(--green)" }}/>
                <i style={{ width: `${pctOf(occ.cleaning)}%`, background: "var(--amber)" }}/>
                <i style={{ width: `${pctOf(occ.outOfOrder)}%`, background: "var(--ink-mute)" }}/>
              </div>
              <div className="occ-legend">
                <div className="occ-leg"><span className="sw" style={{ background: "var(--color-brand)" }}/> Occupied <b>{occ.occupied}</b></div>
                <div className="occ-leg"><span className="sw" style={{ background: "var(--green)" }}/> Available <b>{occ.available}</b></div>
                <div className="occ-leg"><span className="sw" style={{ background: "var(--amber)" }}/> Cleaning <b>{occ.cleaning}</b></div>
                <div className="occ-leg"><span className="sw" style={{ background: "var(--ink-mute)" }}/> Out of order <b>{occ.outOfOrder}</b></div>
              </div>
            </div>
          </div>

          {/* activity */}
          {isAdmin && (
            <div className="panel">
              <div className="panel-h">
                <div className="panel-h-l"><div className="panel-h-t">Activity</div><div className="panel-h-m">live</div></div>
                <Link href={op("/audit")} className="btn soft sm">Audit log {Ico.arrow}</Link>
              </div>
              <div className="act-list">
                {activity.length === 0 ? (
                  <div className="empty" style={{ padding: "16px 14px" }}>No recent activity.</div>
                ) : activity.map((a) => (
                  <div className="act-row" key={a.id}>
                    <span className="act-t">{a.t}</span>
                    <span className="act-text"><strong>{a.who}</strong> {a.verb} {a.obj && <span className="obj">{a.obj}</span>}</span>
                    <span className={`tag tag-${a.tone}`}><span className="ddot"/> {a.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* quick actions */}
      <div className="qb">
        <Link href={op("/reg-cards/new")} className="qb-item">
          <div className="qb-icon">{Ico.plus}</div>
          <div className="qb-text"><div className="qb-t">New registration</div><div className="qb-s">Scan or manual entry</div></div>
          <span className="qb-kbd">⌘N</span>
        </Link>
        <Link href={op("/reg-cards")} className="qb-item">
          <div className="qb-icon">{Ico.card}</div>
          <div className="qb-text"><div className="qb-t">Reg cards</div><div className="qb-s">All registrations</div></div>
        </Link>
        <Link href={op("/rooms")} className="qb-item">
          <div className="qb-icon">{Ico.room}</div>
          <div className="qb-text"><div className="qb-t">Room board</div><div className="qb-s">{occ.total} rooms</div></div>
        </Link>
        <Link href={op("/audit")} className="qb-item">
          <div className="qb-icon">{Ico.log}</div>
          <div className="qb-text"><div className="qb-t">Audit log</div><div className="qb-s">Every action</div></div>
        </Link>
      </div>
    </div>
  );
}

function Track({ arrivals }: { arrivals: Arrival[] }) {
  const span = END - START;
  const now = new Date();
  const nowT = now.getHours() + now.getMinutes() / 60;
  const nowLeft = nowT >= START && nowT <= END ? ((nowT - START) / span) * 100 : null;
  const marks = arrivals.map((a) => ({ a, left: trackLeft(a.eta) })).filter((m) => m.left != null);

  return (
    <div className="track">
      <div className="track-axis">
        {Array.from({ length: span + 1 }, (_, i) => (
          <div className="track-tick" key={i} style={{ left: `${(i / span) * 100}%` }}><span>{String(START + i).padStart(2, "0")}</span></div>
        ))}
      </div>
      <div className="track-bar">
        {nowLeft != null && <div className="track-now" style={{ left: `${nowLeft}%` }}><span className="track-now-label">now</span></div>}
        {marks.map(({ a, left }) => (
          <div className="track-mark" key={a.id} style={{ left: `${left}%` }} title={a.name}>
            <div className="track-mark-pin" style={{ background: a.tone }}/>
            <div className="track-mark-card"><div className="track-mark-eta mono">{a.eta}</div><div className="track-mark-name">{a.name}</div><div className="track-mark-meta">{a.room}</div></div>
          </div>
        ))}
        {marks.length === 0 && <span style={{ position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)", fontSize: 11, color: "var(--ink-faint)" }}>No timed arrivals plotted</span>}
      </div>
    </div>
  );
}

const DASH_CSS = `
.dash { display: flex; flex-direction: column; gap: 16px; max-width: 1500px; }
.dash .empty { padding: 28px 14px; text-align: center; color: var(--ink-faint); font-size: 12.5px; }
.dash .kpi-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.dash .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px 14px 10px; display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow-xs); min-width: 0; }
.dash .kpi-label { font-size: 11px; font-weight: 500; color: var(--ink-3); }
.dash .kpi-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.dash .kpi-val { display: flex; align-items: baseline; gap: 4px; font-variant-numeric: tabular-nums; }
.dash .kpi-num { font-family: var(--font-tight); font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: var(--ink); line-height: 1; }
.dash .kpi-unit { font-size: 12px; color: var(--ink-faint); font-weight: 500; }
.dash .kpi-delta { display: inline-flex; align-items: center; gap: 3px; font-size: 11.5px; font-weight: 500; text-transform: capitalize; }
.dash .kpi-delta.tone-green { color: var(--green); } .dash .kpi-delta.tone-amber { color: var(--amber); } .dash .kpi-delta.tone-rose { color: var(--rose); } .dash .kpi-delta.tone-grey { color: var(--ink-faint); }

.dash .track-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px 18px 18px; box-shadow: var(--shadow-xs); }
.dash .track-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.dash .track-title { font-size: 13px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 8px; }
.dash .track-title .meta { font-size: 11px; font-weight: 500; color: var(--ink-faint); font-family: var(--font-mono); }
.dash .track-legend { display: flex; gap: 12px; font-size: 11px; color: var(--ink-3); }
.dash .track-legend span { display: flex; align-items: center; gap: 5px; } .dash .track-legend .b { width: 8px; height: 8px; border-radius: 2px; }
.dash .track { position: relative; padding-top: 40px; padding-bottom: 8px; }
.dash .track-axis { position: absolute; top: 0; left: 0; right: 0; height: 22px; }
.dash .track-tick { position: absolute; top: 0; transform: translateX(-50%); font-family: var(--font-mono); font-size: 10px; color: var(--ink-faint); }
.dash .track-tick::after { content: ''; position: absolute; left: 50%; top: 16px; width: 1px; height: 6px; background: var(--border); }
.dash .track-bar { position: relative; height: 4px; background: var(--surface-2); border-radius: 2px; }
.dash .track-now { position: absolute; top: -10px; bottom: -20px; width: 1.5px; background: var(--rose); z-index: 3; }
.dash .track-now::after { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; border-radius: 50%; background: var(--rose); box-shadow: 0 0 0 3px rgba(225,29,72,0.15); }
.dash .track-now-label { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-family: var(--font-mono); font-size: 10px; color: var(--rose); font-weight: 600; white-space: nowrap; background: var(--surface); padding: 0 4px; }
.dash .track-mark { position: absolute; top: -10px; z-index: 2; }
.dash .track-mark-pin { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--border); transform: translateX(-50%); }
.dash .track-mark-card { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); padding: 5px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow-sm); min-width: 110px; display: flex; flex-direction: column; gap: 1px; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
.dash .track-mark:hover .track-mark-card { opacity: 1; }
.dash .track-mark-eta { font-size: 10.5px; color: var(--ink-faint); }
.dash .track-mark-name { font-size: 12px; font-weight: 600; color: var(--ink); }
.dash .track-mark-meta { font-size: 11px; color: var(--ink-3); }

.dash .dgrid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 12px; }
.dash .tabs { display: flex; gap: 2px; background: var(--surface-2); padding: 2px; border-radius: var(--r); }
.dash .tab { appearance: none; background: none; border: none; padding: 4px 10px; font: inherit; font-size: 11.5px; font-weight: 500; color: var(--ink-3); cursor: pointer; border-radius: var(--r-sm); display: inline-flex; align-items: center; gap: 6px; }
.dash .tab:hover { color: var(--ink); }
.dash .tab.on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-xs); }
.dash .tab-count { font-family: var(--font-mono); font-size: 9.5px; padding: 1px 4px; border-radius: 3px; background: var(--surface-2); color: var(--ink-faint); }
.dash .tbl-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dash .tbl-name { font-weight: 500; color: var(--ink); }
.dash .tbl-sub { font-size: 11px; color: var(--ink-faint); font-family: var(--font-mono); }
.dash .tbl-cc-flag { display: inline-flex; align-items: center; font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; padding: 1px 4px; border-radius: 3px; background: var(--surface-2); color: var(--ink-3); }
.dash .tbl-row-action { opacity: 0; display: inline-flex; gap: 4px; }
.dash .tbl tr:hover .tbl-row-action { opacity: 1; }
.dash .tbl-action { appearance: none; background: none; border: 1px solid var(--border); font: inherit; font-size: 11px; font-weight: 500; color: var(--ink-2); padding: 2px 8px; border-radius: 4px; cursor: pointer; text-decoration: none; }
.dash .tbl-action:hover { background: var(--surface-2); }

.dash .side-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.dash .occ { padding: 12px 14px 14px; }
.dash .occ-row1 { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.dash .occ-big { font-family: var(--font-tight); font-size: 28px; font-weight: 600; letter-spacing: -0.025em; line-height: 1; color: var(--ink); }
.dash .occ-big span { font-size: 14px; font-weight: 500; color: var(--ink-faint); }
.dash .occ-fill { font-size: 11px; color: var(--ink-faint); font-family: var(--font-mono); }
.dash .occ-bar { height: 8px; border-radius: 4px; background: var(--surface-2); overflow: hidden; display: flex; margin-bottom: 10px; }
.dash .occ-bar > i { height: 100%; }
.dash .occ-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; font-size: 11.5px; }
.dash .occ-leg { display: flex; align-items: center; gap: 6px; color: var(--ink-3); }
.dash .occ-leg b { color: var(--ink); margin-left: auto; font-family: var(--font-mono); font-size: 11px; font-weight: 600; }
.dash .occ-leg .sw { width: 8px; height: 8px; border-radius: 2px; }

.dash .act-list { padding: 4px 0; }
.dash .act-row { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 8px; padding: 7px 14px; font-size: 12px; border-bottom: 1px solid var(--border-faint); }
.dash .act-row:last-child { border-bottom: none; }
.dash .act-row:hover { background: var(--surface-2); }
.dash .act-t { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-faint); }
.dash .act-text { color: var(--ink-2); line-height: 1.35; }
.dash .act-text strong { color: var(--ink); font-weight: 600; }
.dash .act-text .obj { font-family: var(--font-mono); color: var(--accent); font-weight: 500; }

.dash .att { padding: 14px 14px 12px; }
.dash .att-h { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; margin-bottom: 8px; color: var(--ink); }
.dash .att-h-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 0 3px rgba(217,119,6,0.2); }
.dash .att-list { display: flex; flex-direction: column; gap: 4px; }
.dash .att-item { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 8px 10px; border-radius: var(--r); background: var(--surface-2); cursor: pointer; align-items: center; }
.dash .att-item:hover { background: var(--surface-3); }
.dash .att-item-l { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dash .att-item-t { font-size: 12px; font-weight: 500; color: var(--ink); }
.dash .att-item-m { font-size: 11px; color: var(--ink-faint); }
.dash .att-item-r { font-family: var(--font-mono); font-size: 12px; color: var(--ink-faint); }

.dash .qb { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.dash .qb-item { font-family: inherit; text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: border-color 0.1s; text-decoration: none; }
.dash .qb-item:hover { border-color: var(--accent); }
.dash .qb-icon { width: 28px; height: 28px; border-radius: var(--r-sm); background: var(--accent-soft); color: var(--accent); display: grid; place-items: center; flex-shrink: 0; }
.dash .qb-icon svg { width: 14px; height: 14px; }
.dash .qb-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.dash .qb-t { font-size: 12.5px; font-weight: 600; color: var(--ink); }
.dash .qb-s { font-size: 11px; color: var(--ink-faint); }
.dash .qb-kbd { margin-left: auto; font-family: var(--font-mono); font-size: 9.5px; color: var(--ink-faint); padding: 1px 5px; border-radius: 3px; background: var(--surface-2); }

@media (max-width: 1280px) { .dash .kpi-strip { grid-template-columns: repeat(3, 1fr); } .dash .kpi-strip > :nth-child(4), .dash .kpi-strip > :nth-child(5) { display: none; } }
@media (max-width: 1100px) { .dash .dgrid { grid-template-columns: 1fr; } .dash .qb { grid-template-columns: 1fr 1fr; } }
`;
