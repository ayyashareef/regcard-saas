"use server";

import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { isStayActive } from "@/lib/stay-status";

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getDashboardKpis() {
  const { orgId } = await requireTenant();
  const { start, end } = todayBounds();
  const now = new Date();

  // Fetch any reg card that *might* still be active, then filter in JS using
  // the shared `isStayActive` helper so the count matches the badge logic.
  const candidates = await prisma.regCard.findMany({
    where: {
      orgId,
      arrivalDate: { lte: now },
      OR: [{ departureDate: null }, { departureDate: { gte: start } }],
    },
    select: { roomId: true, arrivalDate: true, departureDate: true },
  });
  const active = candidates.filter((c) => isStayActive(c, now));

  const [todayCheckIns, totalRooms, pendingExtensions] = await Promise.all([
    prisma.regCard.count({ where: { orgId, arrivalDate: { gte: start, lt: end } } }),
    prisma.room.count({ where: { orgId, isActive: true } }),
    prisma.extensionRequest.count({ where: { orgId, status: "PENDING" } }),
  ]);

  const occupiedRoomIds = new Set(
    active.map((c) => c.roomId).filter((id): id is string => Boolean(id)),
  );

  return {
    todayCheckIns,
    activeGuests: active.length,
    totalRooms,
    roomsOccupied: occupiedRoomIds.size,
    pendingExtensions,
  };
}

export async function getTodayArrivals(limit = 10) {
  const { orgId } = await requireTenant();
  const { start, end } = todayBounds();

  return prisma.regCard.findMany({
    where: { orgId, arrivalDate: { gte: start, lt: end } },
    include: { room: true },
    orderBy: [{ arrivalDate: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
}

export async function getRecentRegCards(limit = 5) {
  const { orgId } = await requireTenant();
  return prisma.regCard.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { room: true },
  });
}

export async function getOccupancyBreakdown() {
  const { orgId } = await requireTenant();
  const { start } = todayBounds();
  const now = new Date();

  const [total, candidates] = await Promise.all([
    prisma.room.count({ where: { orgId, isActive: true } }),
    prisma.regCard.findMany({
      where: {
        orgId,
        arrivalDate: { lte: now },
        OR: [{ departureDate: null }, { departureDate: { gte: start } }],
        roomId: { not: null },
      },
      select: { roomId: true, arrivalDate: true, departureDate: true },
    }),
  ]);

  const occupiedRoomIds = new Set(
    candidates
      .filter((c) => isStayActive(c, now))
      .map((c) => c.roomId)
      .filter((id): id is string => Boolean(id)),
  );
  const occupied = occupiedRoomIds.size;
  // TODO: cleaning + outOfOrder require a Room.status enum that doesn't exist
  // in the schema yet. Hardcoded to 0 until the Rooms-view session adds it.
  // Tracked in .claude/docs/gotchas.md.
  return {
    total,
    occupied,
    available: Math.max(0, total - occupied),
    cleaning: 0,
    outOfOrder: 0,
  };
}

export async function getRecentActivity(limit = 8) {
  const { orgId } = await requireTenant();
  return prisma.auditLog.findMany({
    where: { orgId, archivedAt: null },
    include: { performedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
