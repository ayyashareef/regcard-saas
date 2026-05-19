import { requireRole } from "@/lib/auth/session";
import { getAllRooms } from "@/lib/actions/rooms";
import { RoomsManager } from "@/components/admin/rooms-manager";

export default async function RoomsPage() {
  await requireRole("MANAGER", "SUPER_ADMIN");
  const rooms = await getAllRooms();

  const serialized = rooms.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-deep">Manage Rooms</h2>
        <p className="text-neutral-muted text-sm mt-1">{rooms.length} rooms total</p>
      </div>
      <RoomsManager rooms={serialized} />
    </div>
  );
}
