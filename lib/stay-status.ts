/**
 * Single source of truth for "is this stay still active?" — used by the
 * dashboard KPIs, occupancy ring, room board, and arrivals badge so they
 * always agree. Comparing on local-date-only (Y/M/D) avoids the
 * server-timezone vs UTC-midnight boundary glitches that previously let a
 * card show "Checked out" while still counting as Occupied (1/39).
 */

export type StayShape = {
  arrivalDate?: Date | null;
  departureDate?: Date | null;
  checkInTime?: string | null;
};

/** Local-midnight ms for the given Date (drops any wall-clock time). */
export function localDateMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * A stay is "over" only once the departure day is strictly in the past.
 * On the departure day itself the guest is still considered in-house —
 * matches hotel convention (guest occupies the room until checkout that day).
 */
export function isStayOver(card: StayShape, now: Date = new Date()): boolean {
  if (!card.departureDate) return false;
  return localDateMs(card.departureDate) < localDateMs(now);
}

/**
 * A stay is "occupying a room" when:
 *   arrival has happened (or is today) AND the stay is not yet over.
 */
export function isStayActive(card: StayShape, now: Date = new Date()): boolean {
  if (isStayOver(card, now)) return false;
  if (card.arrivalDate && localDateMs(card.arrivalDate) > localDateMs(now)) return false;
  return true;
}

export type ArrivalBadge = "in" | "out" | "pending";

/** Status badge shown on the arrivals table — derived from the same predicates. */
export function getArrivalBadge(card: StayShape, now: Date = new Date()): ArrivalBadge {
  if (isStayOver(card, now)) return "out";
  if (card.checkInTime) return "in";
  return "pending";
}
