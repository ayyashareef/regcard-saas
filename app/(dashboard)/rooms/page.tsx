import { requireAuth } from "@/lib/auth/session";
import { getRoomBoard } from "@/lib/actions/rooms";
import { RoomsView } from "@/components/v2/rooms/rooms-view";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  await requireAuth();
  const { floors, totals } = await getRoomBoard();
  return <RoomsView floors={floors} totals={totals} />;
}
