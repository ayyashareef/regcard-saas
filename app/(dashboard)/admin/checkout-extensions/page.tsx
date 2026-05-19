import { requireAuth } from "@/lib/auth/session";
import { getExtensionRequests } from "@/lib/actions/extension-requests";
import { ExtensionsManager } from "@/components/admin/extensions-manager";

export default async function CheckoutExtensionsPage() {
  await requireAuth();
  const requests = await getExtensionRequests();

  const serialized = requests.map((r) => ({
    ...r,
    newDepartureDate: r.newDepartureDate?.toISOString() || null,
    reviewedAt: r.reviewedAt?.toISOString() || null,
    createdAt: r.createdAt.toISOString(),
    regCard: {
      ...r.regCard,
      date: r.regCard.date.toISOString(),
      dateOfBirth: r.regCard.dateOfBirth?.toISOString() || null,
      arrivalDate: r.regCard.arrivalDate?.toISOString() || null,
      departureDate: r.regCard.departureDate?.toISOString() || null,
      createdAt: r.regCard.createdAt.toISOString(),
      updatedAt: r.regCard.updatedAt.toISOString(),
    },
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-deep">Checkout Extensions</h2>
        <p className="text-neutral-muted text-sm mt-1">Approve or reject extension requests</p>
      </div>
      <ExtensionsManager requests={serialized} />
    </div>
  );
}
