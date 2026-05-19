"use client";

import type { SVGProps } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteRegCard } from "@/lib/actions/reg-cards";
import { createExtensionRequest } from "@/lib/actions/extension-requests";

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v9.5m0 0 3.25-3.25M12 14.25 8.75 11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.75 16.75v1.5A1.75 1.75 0 0 0 7.5 20h9a1.75 1.75 0 0 0 1.75-1.75v-1.5" />
    </svg>
  );
}

interface ExtensionRequest {
  id: string;
  newCheckoutTime: string | null;
  newDepartureDate: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  requestedBy: { name: string; email: string };
  reviewedBy: { name: string; email: string } | null;
  reviewedAt: string | null;
}

interface RegCardDetailProps {
  regCard: {
    id: string;
    cardNo: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    checkOutDate: string | null;
    guestName: string | null;
    contactNo: string | null;
    whatsappNo: string | null;
    email: string | null;
    company: string | null;
    nationality: string | null;
    country: string | null;
    idType: string;
    idNumber: string | null;
    dateOfBirth: string | null;
    arrivalDate: string | null;
    departureDate: string | null;
    roomId: string | null;
    room: { number: string; floor: string | null; type: string | null } | null;
    mealPlan: string | null;
    signatureData: string | null;
    passportPhoto: string | null;
    chipPhoto?: string | null;
    extensionRequests: ExtensionRequest[];
  };
  rooms: { id: string; number: string }[];
  userRole: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const idTypeLabels: Record<string, string> = {
  TOURIST: "Tourist",
  MALDIVIAN: "Maldivian",
  WORK_PERMIT: "Work Permit Holder",
  DIPLOMAT: "Diplomat",
};

const mealPlanLabels: Record<string, string> = {
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
};

export function RegCardDetail({ regCard, rooms, userRole }: RegCardDetailProps) {
  const router = useRouter();
  const [showExtForm, setShowExtForm] = useState(false);
  const [extLoading, setExtLoading] = useState(false);
  const [extData, setExtData] = useState({
    newCheckoutTime: "",
    newDepartureDate: "",
    note: "",
  });

  const canDelete = userRole === "MANAGER" || userRole === "SUPER_ADMIN";
  const hasPendingExtension = regCard.extensionRequests.some((er) => er.status === "PENDING");

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this registration card?")) return;
    try {
      await deleteRegCard(regCard.id);
      toast.success("Card deleted");
      router.push("/reg-cards");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  }

  async function handleExtension(e: React.FormEvent) {
    e.preventDefault();
    setExtLoading(true);
    try {
      await createExtensionRequest({
        regCardId: regCard.id,
        ...extData,
      });
      toast.success("Extension request submitted");
      setShowExtForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setExtLoading(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      const res = await fetch(`/api/reg-cards/${regCard.id}/pdf`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${regCard.cardNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  }

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
      <dt className="text-xs text-neutral-muted uppercase tracking-wide">{label}</dt>
      <dd className="text-sm font-medium text-neutral-text mt-0.5">{value || "—"}</dd>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-deep">{regCard.cardNo}</h2>
          <p className="text-neutral-muted text-sm mt-1">
            {regCard.guestName}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-border bg-white px-4 py-2 text-sm font-medium text-neutral-text shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-neutral-section hover:shadow-md active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <DownloadIcon className="h-4 w-4" />
            Download PDF
          </button>
          <Link
            href={`/reg-cards/${regCard.id}/edit`}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light transition"
          >
            Edit
          </Link>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-neutral-border p-5">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2 mb-4">Basic Information</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Date" value={new Date(regCard.date).toLocaleDateString("en-GB")} />
          <Field label="Check-in Time" value={regCard.checkInTime} />
          <Field label="Check-out Date" value={regCard.checkOutDate ? new Date(regCard.checkOutDate).toLocaleDateString("en-GB") : null} />
          <Field label="Check-out Time" value={regCard.checkOutTime} />
          <Field label="ID Type" value={idTypeLabels[regCard.idType]} />
        </dl>
      </section>

      {/* Guest Info */}
      <section className="bg-white rounded-xl border border-neutral-border p-5">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2 mb-4">Guest Information</h3>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Guest Name" value={regCard.guestName} />
          <Field label="Contact No" value={regCard.contactNo} />
          <Field label="WhatsApp" value={regCard.whatsappNo} />
          <Field label="Email" value={regCard.email} />
          <Field label="Booking Method" value={regCard.company} />
          <Field label="Nationality" value={regCard.nationality} />
          <Field label="Country" value={regCard.country} />
          <Field label="Date of Birth" value={regCard.dateOfBirth ? new Date(regCard.dateOfBirth).toLocaleDateString("en-GB") : null} />
          <Field label="ID Number" value={regCard.idNumber} />
        </dl>
      </section>

      {/* Stay Details */}
      <section className="bg-white rounded-xl border border-neutral-border p-5">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2 mb-4">Stay Details</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Arrival" value={regCard.arrivalDate ? new Date(regCard.arrivalDate).toLocaleDateString("en-GB") : null} />
          <Field label="Departure" value={regCard.departureDate ? new Date(regCard.departureDate).toLocaleDateString("en-GB") : null} />
          <Field label="Room" value={regCard.room ? `${regCard.room.number}${regCard.room.type ? ` (${regCard.room.type})` : ""}` : null} />
          <Field label="Meal Plan" value={regCard.mealPlan ? mealPlanLabels[regCard.mealPlan] : null} />
        </dl>
      </section>

      {/* Passport Photo */}
      {(regCard.passportPhoto || regCard.chipPhoto) && (
        <section className="bg-white rounded-xl border border-neutral-border p-5">
          <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2 mb-4">Passport Photos</h3>
          <div className="flex flex-wrap gap-4">
            {regCard.passportPhoto && (
              <div>
                <p className="text-xs text-neutral-muted uppercase tracking-wide mb-1">Camera capture</p>
                <img
                  src={regCard.passportPhoto}
                  alt="Passport page photo"
                  className="max-w-sm rounded-lg border border-neutral-border"
                />
              </div>
            )}
            {regCard.chipPhoto && (
              <div>
                <p className="text-xs text-neutral-muted uppercase tracking-wide mb-1">NFC chip (biometric)</p>
                <img
                  src={regCard.chipPhoto}
                  alt="Chip biometric photo"
                  className="max-w-[200px] rounded-lg border border-neutral-border"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Signature */}
      {regCard.signatureData && (
        <section className="bg-white rounded-xl border border-neutral-border p-5">
          <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2 mb-4">Signature</h3>
          <img
            src={regCard.signatureData}
            alt="Guest signature"
            className="max-w-xs border border-neutral-border rounded-lg"
          />
        </section>
      )}

      {/* Checkout Extension */}
      <section className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-border pb-2">
          <h3 className="font-semibold text-brand-deep">Checkout Extensions</h3>
          {!showExtForm && !hasPendingExtension && (
            <button
              onClick={() => setShowExtForm(true)}
              className="bg-brand text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-light transition"
            >
              Request Checkout Extension
            </button>
          )}
        </div>

        {showExtForm && (
          <form onSubmit={handleExtension} className="border border-neutral-border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-1">New Checkout Time</label>
                <input
                  type="time"
                  value={extData.newCheckoutTime}
                  onChange={(e) => setExtData({ ...extData, newCheckoutTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-1">New Departure Date</label>
                <input
                  type="date"
                  value={extData.newDepartureDate}
                  onChange={(e) => setExtData({ ...extData, newDepartureDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Note (optional)</label>
              <textarea
                value={extData.note}
                onChange={(e) => setExtData({ ...extData, note: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={extLoading}
                className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light disabled:opacity-50 transition"
              >
                {extLoading ? "Submitting…" : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => setShowExtForm(false)}
                className="px-4 py-2 rounded-lg border border-neutral-border text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {regCard.extensionRequests.length > 0 ? (
          <div className="space-y-2">
            {regCard.extensionRequests.map((er) => (
              <div key={er.id} className="border border-neutral-border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[er.status]}`}>
                    {er.status}
                  </span>
                  <span className="text-neutral-muted text-xs">
                    {new Date(er.createdAt).toLocaleDateString("en-GB")} by {er.requestedBy.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {er.newCheckoutTime && (
                    <div><span className="text-neutral-muted">New checkout:</span> {er.newCheckoutTime}</div>
                  )}
                  {er.newDepartureDate && (
                    <div><span className="text-neutral-muted">New departure:</span> {new Date(er.newDepartureDate).toLocaleDateString("en-GB")}</div>
                  )}
                  {er.note && <div className="col-span-2"><span className="text-neutral-muted">Note:</span> {er.note}</div>}
                  {er.reviewedBy && (
                    <div className="col-span-2"><span className="text-neutral-muted">Reviewed by:</span> {er.reviewedBy.name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-muted">No extension requests</p>
        )}
      </section>
    </div>
  );
}
