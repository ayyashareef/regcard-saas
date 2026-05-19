import { requireAuth } from "@/lib/auth/session";
import {
  getDashboardKpis,
  getTodayArrivals,
  getRecentRegCards,
  getOccupancyBreakdown,
  getRecentActivity,
} from "@/lib/actions/dashboard";
import { KpiCard } from "@/components/v2/dashboard/kpi-card";
import { ArrivalsTable } from "@/components/v2/dashboard/arrivals-table";
import { RecentCardsTable } from "@/components/v2/dashboard/recent-cards-table";
import { OccupancyRing } from "@/components/v2/dashboard/occupancy-ring";
import { ActivityFeed } from "@/components/v2/dashboard/activity-feed";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(full: string | null | undefined) {
  if (!full) return "there";
  return full.split(/\s+/)[0] || "there";
}

function weekday() {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date());
}

export default async function DashboardPage() {
  const session = await requireAuth();

  const [kpis, arrivals, recent, occupancy, activity] = await Promise.all([
    getDashboardKpis(),
    getTodayArrivals(8),
    getRecentRegCards(5),
    getOccupancyBreakdown(),
    getRecentActivity(8),
  ]);

  const occupancyPct =
    occupancy.total > 0 ? Math.round((occupancy.occupied / occupancy.total) * 100) : 0;

  const isAdmin = session.user.role !== "STAFF";

  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <div className="mb-10 flex items-end justify-between gap-8 lg:mb-14">
        <div>
          <small
            className="block font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: ".24em",
              color: "var(--color-brand-deep)",
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            {weekday()} · Front of House
          </small>
          <h1
            className="font-serif"
            style={{
              fontWeight: 600,
              fontSize: "clamp(28px, 6vw, 48px)",
              lineHeight: 1.05,
              color: "var(--color-ink)",
              letterSpacing: "-.005em",
            }}
          >
            {greeting()}, {firstName(session.user.name)}
            <span
              className="font-mono uppercase inline-flex items-center gap-1.5"
              style={{
                fontSize: 11,
                letterSpacing: ".16em",
                color: "var(--color-status-green)",
                fontWeight: 600,
                marginLeft: 18,
                verticalAlign: "middle",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--color-status-green)",
                  boxShadow: "0 0 0 3px rgba(63,122,74,.18)",
                  display: "inline-block",
                }}
              />
              Live
            </span>
          </h1>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-12 lg:grid-cols-4">
        <KpiCard
          label="Check-ins Today"
          value={kpis.todayCheckIns}
          unit={`/ ${arrivals.length + kpis.todayCheckIns > 0 ? Math.max(kpis.todayCheckIns, arrivals.length) : 0} expected`}
        />
        <KpiCard label="Active Guests" value={kpis.activeGuests} unit="in-house" />
        <KpiCard
          label="Rooms Occupied"
          value={kpis.roomsOccupied}
          unit={`/ ${kpis.totalRooms}`}
          progressPercent={kpis.totalRooms > 0 ? (kpis.roomsOccupied / kpis.totalRooms) * 100 : 0}
          trend={{ dir: "flat", text: `${occupancyPct}%` }}
        />
        {isAdmin ? (
          <KpiCard
            label="Pending Extensions"
            value={kpis.pendingExtensions}
            unit="requests"
            trend={
              kpis.pendingExtensions > 0
                ? { dir: "down", text: "Needs review" }
                : { dir: "up", text: "All clear" }
            }
          />
        ) : (
          <KpiCard label="Total Rooms" value={kpis.totalRooms} unit="active" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:[grid-template-columns:2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <ArrivalsTable arrivals={arrivals} expected={kpis.todayCheckIns} />
          <RecentCardsTable cards={recent} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <OccupancyRing
            total={occupancy.total}
            occupied={occupancy.occupied}
            available={occupancy.available}
            cleaning={occupancy.cleaning}
            outOfOrder={occupancy.outOfOrder}
          />
          {isAdmin && <ActivityFeed entries={activity} />}
        </div>
      </div>
    </div>
  );
}
