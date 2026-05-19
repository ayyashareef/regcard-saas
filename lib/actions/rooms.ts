"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { isStayActive } from "@/lib/stay-status";

export async function getRooms() {
  const { orgId } = await requireTenant();
  return prisma.room.findMany({
    where: { orgId, isActive: true },
    orderBy: { number: "asc" },
  });
}

export async function getAllRooms() {
  const { orgId } = await requireTenant();
  return prisma.room.findMany({
    where: { orgId },
    orderBy: { number: "asc" },
  });
}

export interface RoomBoardEntry {
  id: string;
  number: string;
  type: string | null;
  status: "occupied" | "available";
  guestName: string | null;
  nights: number | null;
}

export interface RoomBoardFloor {
  name: string;
  rooms: RoomBoardEntry[];
  total: number;
  occupied: number;
}

/**
 * Rooms grouped by floor, each annotated with occupancy derived from active
 * in-house reg cards. `cleaning` / `out_of_order` aren't represented because the
 * Room model has no status field yet (see .claude/docs/gotchas.md) — every room
 * is either `occupied` or `available`.
 */
export async function getRoomBoard() {
  const { orgId } = await requireTenant();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const [rooms, inHouseCandidates] = await Promise.all([
    prisma.room.findMany({ where: { orgId, isActive: true }, orderBy: { number: "asc" } }),
    prisma.regCard.findMany({
      where: {
        orgId,
        arrivalDate: { lte: now },
        OR: [{ departureDate: null }, { departureDate: { gte: today } }],
        roomId: { not: null },
      },
      select: { roomId: true, guestName: true, arrivalDate: true, departureDate: true },
    }),
  ]);
  // Filter to truly-active stays using the shared helper so the board agrees
  // with the dashboard KPIs and the arrivals-table badge.
  const inHouse = inHouseCandidates.filter((c) => isStayActive(c, now));

  const occByRoom = new Map<string, { guestName: string | null; nights: number | null }>();
  for (const c of inHouse) {
    if (!c.roomId) continue;
    let nights: number | null = null;
    if (c.arrivalDate && c.departureDate) {
      const ms = c.departureDate.getTime() - c.arrivalDate.getTime();
      nights = Math.max(0, Math.round(ms / 86_400_000));
    }
    // First match wins (rooms shouldn't have two active guests, but be safe).
    if (!occByRoom.has(c.roomId)) occByRoom.set(c.roomId, { guestName: c.guestName, nights });
  }

  const floorMap = new Map<string, RoomBoardEntry[]>();
  for (const r of rooms) {
    const occ = occByRoom.get(r.id);
    const entry: RoomBoardEntry = {
      id: r.id,
      number: r.number,
      type: r.type,
      status: occ ? "occupied" : "available",
      guestName: occ?.guestName ?? null,
      nights: occ?.nights ?? null,
    };
    // Floor label: explicit field, else first part of the room number, else "Other".
    const label = r.floor?.trim() || (/^\d+/.test(r.number) ? `Floor ${r.number[0]}` : "Other");
    if (!floorMap.has(label)) floorMap.set(label, []);
    floorMap.get(label)!.push(entry);
  }

  const floors: RoomBoardFloor[] = [...floorMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([name, list]) => ({
      name,
      rooms: list,
      total: list.length,
      occupied: list.filter((r) => r.status === "occupied").length,
    }));

  const total = rooms.length;
  const occupied = [...occByRoom.keys()].length;
  return {
    floors,
    totals: { total, occupied, available: Math.max(0, total - occupied) },
  };
}

export async function createRoom(data: {
  number: string;
  floor?: string;
  type?: string;
}) {
  const { session, orgId } = await requireTenant();
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  const room = await prisma.room.create({
    data: {
      orgId,
      number: data.number,
      floor: data.floor || null,
      type: data.type || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "ROOM_CREATED",
      entity: "ROOM",
      entityId: room.id,
      entityLabel: room.number,
      performedById: session.user.id,
    },
  });

  revalidatePath("/admin/rooms");
  return room;
}

export async function updateRoom(
  id: string,
  data: { number?: string; floor?: string; type?: string; isActive?: boolean }
) {
  const { session, orgId } = await requireTenant();
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  // Ownership guard: never update a room belonging to another tenant.
  const owned = await prisma.room.findFirst({ where: { id, orgId } });
  if (!owned) throw new Error("Not found");

  const room = await prisma.room.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "ROOM_UPDATED",
      entity: "ROOM",
      entityId: room.id,
      entityLabel: room.number,
      performedById: session.user.id,
    },
  });

  revalidatePath("/admin/rooms");
  return room;
}

export async function deleteRoom(id: string) {
  const { session, orgId } = await requireTenant();
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  const room = await prisma.room.findFirst({ where: { id, orgId } });
  if (!room) throw new Error("Not found");

  await prisma.room.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "ROOM_DELETED",
      entity: "ROOM",
      entityId: id,
      entityLabel: room.number,
      performedById: session.user.id,
    },
  });

  revalidatePath("/admin/rooms");
}
