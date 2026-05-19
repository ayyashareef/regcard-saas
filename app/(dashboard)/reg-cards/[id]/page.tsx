import { requireAuth } from "@/lib/auth/session";
import { getRegCard } from "@/lib/actions/reg-cards";
import { getRooms } from "@/lib/actions/rooms";
import { notFound } from "next/navigation";
import { RegCardDetail } from "@/components/reg-card-detail";

export default async function RegCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const regCard = await getRegCard(id);

  if (!regCard) notFound();

  const rooms = await getRooms();

  const serialized = {
    ...regCard,
    date: regCard.date.toISOString(),
    dateOfBirth: regCard.dateOfBirth?.toISOString() || null,
    arrivalDate: regCard.arrivalDate?.toISOString() || null,
    departureDate: regCard.departureDate?.toISOString() || null,
    checkOutDate: regCard.checkOutDate?.toISOString() || null,
    createdAt: regCard.createdAt.toISOString(),
    updatedAt: regCard.updatedAt.toISOString(),
    extensionRequests: regCard.extensionRequests.map((er) => ({
      ...er,
      newDepartureDate: er.newDepartureDate?.toISOString() || null,
      reviewedAt: er.reviewedAt?.toISOString() || null,
      createdAt: er.createdAt.toISOString(),
    })),
  };

  return (
    <RegCardDetail
      regCard={serialized}
      rooms={rooms}
      userRole={session.user.role}
    />
  );
}
