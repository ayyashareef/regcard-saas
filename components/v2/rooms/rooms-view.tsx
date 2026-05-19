import type { RoomBoardFloor } from "@/lib/actions/rooms";
import { PageHeaderV2, HeaderButton } from "@/components/v2/page-header";
import { KpiCard } from "@/components/v2/dashboard/kpi-card";

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

const STATUS_META = {
  occupied: { border: "var(--color-brand)", badgeBg: "rgba(184,137,59,.14)", badgeColor: "var(--color-brand-deep)", label: "Occupied" },
  available: { border: "var(--color-status-green)", badgeBg: "rgba(63,122,74,.12)", badgeColor: "var(--color-status-green)", label: "Available" },
} as const;

export function RoomsView({ floors, totals }: Props) {
  const occPct = totals.total > 0 ? Math.round((totals.occupied / totals.total) * 100) : 0;

  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <PageHeaderV2
        eyebrow="Inventory"
        title="Manage rooms"
        subtitle={`${totals.total} room${totals.total === 1 ? "" : "s"} across ${floors.length} floor${floors.length === 1 ? "" : "s"}. Track status, type, and assignment at a glance.`}
        actions={<HeaderButton variant="primary" href="/admin/rooms">+ Add room</HeaderButton>}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:mb-10">
        <KpiCard label="Total" value={totals.total} />
        <KpiCard label="Occupied" value={totals.occupied} unit={`${occPct}%`} progressPercent={occPct} />
        <KpiCard label="Available" value={totals.available} />
      </div>

      {floors.length === 0 ? (
        <div className="text-center" style={{ padding: "56px 22px", color: "var(--color-text-soft)", fontSize: 13, background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10 }}>
          No rooms configured yet.
        </div>
      ) : (
        floors.map((floor) => {
          const pct = floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0;
          return (
            <div key={floor.name} className="mb-8 last:mb-0">
              <div
                className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                style={{ borderColor: "var(--color-line)" }}
              >
                <div>
                  <div className="font-serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1 }}>{floor.name}</div>
                  <div className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: ".16em", color: "var(--color-text-soft)", marginTop: 6, fontWeight: 500 }}>{floor.occupied} of {floor.total} occupied</div>
                </div>
                <div className="w-full sm:w-[200px]" style={{ height: 6, background: "var(--color-cream-2)", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#c69a4a,#a07424)", borderRadius: 3 }} />
                </div>
              </div>

              <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {floor.rooms.map((room) => {
                  const m = STATUS_META[room.status];
                  return (
                    <div
                      key={room.id}
                      className="relative"
                      style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10, padding: "16px 16px 14px" }}
                    >
                      <span aria-hidden style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 3, borderRadius: "0 3px 3px 0", background: m.border }} />
                      <div className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1, letterSpacing: "-.01em" }}>{room.number}</div>
                      {room.type && <div className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--color-brand-deep)", fontWeight: 600, marginTop: 6 }}>{room.type}</div>}
                      <div style={{ fontSize: 12.5, color: "var(--color-text-soft)", marginTop: 10, minHeight: 18 }}>
                        {room.status === "occupied"
                          ? `${shortGuest(room.guestName)}${room.nights != null ? ` · ${room.nights}n` : ""}`
                          : "—"}
                      </div>
                      <span
                        className="font-mono uppercase"
                        style={{ position: "absolute", top: 14, right: 12, fontSize: 9.5, letterSpacing: ".12em", fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: m.badgeBg, color: m.badgeColor }}
                      >
                        {m.label}
                      </span>
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
