import { requireAuth } from "@/lib/auth/session";
import { getRegCard } from "@/lib/actions/reg-cards";
import { getRooms } from "@/lib/actions/rooms";
import { notFound } from "next/navigation";
import { RegCardFormComponent } from "@/components/reg-card-form";

export default async function EditRegCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const regCard = await getRegCard(id);

  if (!regCard) notFound();

  const rooms = await getRooms();

  const initialData = {
    id: regCard.id,
    cardNo: regCard.cardNo,
    date: regCard.date.toISOString().slice(0, 10),
    checkInTime: regCard.checkInTime || "",
    checkOutTime: regCard.checkOutTime || "",
    guestName: regCard.guestName || "",
    contactNo: regCard.contactNo || "",
    whatsappNo: regCard.whatsappNo || "",
    email: regCard.email || "",
    company: regCard.company || "",
    nationality: regCard.nationality || "",
    country: regCard.country || "",
    idType: regCard.idType as "TOURIST" | "MALDIVIAN" | "WORK_PERMIT" | "DIPLOMAT",
    idNumber: regCard.idNumber || "",
    dateOfBirth: regCard.dateOfBirth?.toISOString().slice(0, 10) || "",
    arrivalDate: regCard.arrivalDate?.toISOString().slice(0, 10) || "",
    departureDate: regCard.departureDate?.toISOString().slice(0, 10) || "",
    roomId: regCard.roomId || "",
    mealPlan: (regCard.mealPlan || "") as "BB" | "HB" | "FB" | "",
    signatureData: regCard.signatureData || "",
    passportPhoto: regCard.passportPhoto || "",
    chipPhoto: regCard.chipPhoto || "",
    rawMrzData: regCard.rawMrzData || "",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-deep">Edit {regCard.cardNo}</h2>
        <p className="text-neutral-muted text-sm mt-1">
          {regCard.guestName}
        </p>
      </div>

      <RegCardFormComponent rooms={rooms} initialData={initialData} isEdit />
    </div>
  );
}
