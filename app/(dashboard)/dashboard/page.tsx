import { requireOrg } from "@/lib/tenant";
import {
  getDashboardKpis,
  getTodayArrivals,
  getRecentRegCards,
  getOccupancyBreakdown,
  getRecentActivity,
} from "@/lib/actions/dashboard";
import { DenseDashboard } from "@/components/v2/dashboard/dense-dashboard";

export const dynamic = "force-dynamic";

const TONES = ["#0ea5e9", "#84cc16", "#f97316", "#a855f7", "#ec4899", "#06b6d4", "#14b8a6", "#ef4444"];
function toneFor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
function initialsOf(name: string | null | undefined) {
  if (!name) return "—";
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function dmy(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function nightsBetween(a?: Date | null, b?: Date | null) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

// audit action → human verb + tag + tone
const ACT: Record<string, { verb: string; tag: string; tone: string }> = {
  REG_CARD_CREATED: { verb: "created reg card", tag: "check-in", tone: "green" },
  REG_CARD_UPDATED: { verb: "updated", tag: "edit", tone: "grey" },
  REG_CARD_DELETED: { verb: "deleted", tag: "card", tone: "rose" },
  REG_CARD_PDF_DOWNLOADED: { verb: "downloaded PDF for", tag: "pdf", tone: "grey" },
  USER_CREATED: { verb: "created user", tag: "user", tone: "violet" },
  USER_UPDATED: { verb: "updated user", tag: "user", tone: "violet" },
  USER_DEACTIVATED: { verb: "deactivated user", tag: "user", tone: "rose" },
  USER_LOGIN: { verb: "signed in", tag: "auth", tone: "grey" },
  USER_LOGOUT: { verb: "signed out", tag: "auth", tone: "grey" },
  ROOM_CREATED: { verb: "added room", tag: "room", tone: "sky" },
  ROOM_UPDATED: { verb: "updated room", tag: "room", tone: "sky" },
  ROOM_DELETED: { verb: "removed room", tag: "room", tone: "rose" },
  EXTENSION_REQUESTED: { verb: "requested extension", tag: "extension", tone: "amber" },
  EXTENSION_APPROVED: { verb: "approved extension", tag: "extension", tone: "green" },
  EXTENSION_REJECTED: { verb: "rejected extension", tag: "extension", tone: "rose" },
};

export default async function DashboardPage() {
  const { session, org } = await requireOrg();

  const [kpis, arrivals, recent, occupancy, activity] = await Promise.all([
    getDashboardKpis(),
    getTodayArrivals(8),
    getRecentRegCards(6),
    getOccupancyBreakdown(),
    getRecentActivity(8),
  ]);

  const occupancyPct =
    occupancy.total > 0 ? Math.round((occupancy.occupied / occupancy.total) * 100) : 0;

  return (
    <DenseDashboard
      orgName={org.name}
      isAdmin={session.user.role !== "STAFF"}
      kpis={{
        checkInsToday: kpis.todayCheckIns,
        expected: Math.max(arrivals.length, kpis.todayCheckIns),
        inHouse: kpis.activeGuests,
        occupancyPct,
        totalRooms: kpis.totalRooms,
        roomsOccupied: kpis.roomsOccupied,
        pending: kpis.pendingExtensions,
      }}
      occupancy={{ ...occupancy, pct: occupancyPct }}
      arrivals={arrivals.map((c) => ({
        id: c.id,
        cardNo: c.cardNo,
        name: c.guestName || "Unnamed guest",
        initials: initialsOf(c.guestName),
        tone: toneFor(c.id),
        country: c.nationality || c.country || "—",
        doc: c.idNumber || "—",
        room: c.room?.number || "—",
        eta: c.checkInTime || (c.arrivalDate ? hhmm(c.arrivalDate) : "—"),
        nights: nightsBetween(c.arrivalDate, c.departureDate),
      }))}
      recent={recent.map((c) => ({
        id: c.id,
        cardNo: c.cardNo,
        name: c.guestName || "Unnamed guest",
        initials: initialsOf(c.guestName),
        tone: toneFor(c.id),
        room: c.room?.number || "—",
        created: `${dmy(c.createdAt)} · ${hhmm(c.createdAt)}`,
      }))}
      activity={activity.map((a) => {
        const m = ACT[a.action] || { verb: a.action.toLowerCase().replace(/_/g, " "), tag: "event", tone: "grey" };
        return {
          id: a.id,
          t: hhmm(a.createdAt),
          who: a.performedBy?.name || "system",
          verb: m.verb,
          obj: a.entityLabel || "",
          tag: m.tag,
          tone: m.tone,
        };
      })}
    />
  );
}
