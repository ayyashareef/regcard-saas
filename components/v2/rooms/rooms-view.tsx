import type { RoomBoardFloor } from "@/lib/actions/rooms";
import { PageHeaderV2, HeaderButton } from "@/components/v2/page-header";

interface Props {
  floors: RoomBoardFloor[];
  totals: { total: number; occupied: number; available: number };
}

function shortGuest(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

const STATUS = {
  occupied: { bar: "var(--color-brand)", cls: "tag-violet", label: "Occupied" },
  available: { bar: "var(--green)", cls: "tag-green", label: "Available" },
} as const;

export function RoomsView({ floors, totals }: Props) {
  const occPct = totals.total > 0 ? Math.round((totals.occupied / totals.total) * 100) : 0;

  return (
    <div className="page">
      <PageHeaderV2
        eyebrow="Front desk · Inventory"
        title="Rooms"
        subtitle={`${totals.total} room${totals.total === 1 ? "" : "s"} across ${floors.length} floor${floors.length === 1 ? "" : "s"}.`}
        actions={<HeaderButton variant="primary" href="/admin/rooms">+ Add room</HeaderButton>}
      />

      <div className="stat-row">
        <div className="stat"><div className="stat-label">Total rooms</div><div className="stat-val">{totals.total}</div></div>
        <div className="stat"><div className="stat-label">Occupied</div><div className="stat-val">{totals.occupied} <span>· {occPct}%</span></div></div>
        <div className="stat"><div className="stat-label">Available</div><div className="stat-val">{totals.available}</div></div>
      </div>

      {floors.length === 0 ? (
        <div className="panel"><div className="empty-state">No rooms configured yet.</div></div>
      ) : (
        floors.map((floor) => {
          const pct = floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0;
          return (
            <div key={floor.name} className="panel">
              <div className="panel-h">
                <div className="panel-h-l">
                  <div className="panel-h-t">{floor.name}</div>
                  <div className="panel-h-m">{floor.occupied} / {floor.total} occupied</div>
                </div>
                <div style={{ width: 160, height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-brand)", borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ padding: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {floor.rooms.map((room) => {
                  const m = STATUS[room.status];
                  return (
                    <div key={room.id} style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "13px 14px 12px", overflow: "hidden" }}>
                      <span aria-hidden style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: "0 3px 3px 0", background: m.bar }} />
                      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontFamily: "var(--font-tight)", fontSize: 24, fontWeight: 600, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.02em" }}>{room.number}</div>
                        <span className={`tag ${m.cls}`} style={{ fontSize: 9.5 }}><span className="ddot"/> {m.label}</span>
                      </div>
                      {room.type && <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--ink-faint)", marginTop: 6 }}>{room.type}</div>}
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, minHeight: 16 }}>
                        {room.status === "occupied" ? `${shortGuest(room.guestName)}${room.nights != null ? ` · ${room.nights}n` : ""}` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
