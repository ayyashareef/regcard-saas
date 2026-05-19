"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reviewExtensionRequest } from "@/lib/actions/extension-requests";

interface ExtensionRequest {
  id: string;
  newCheckoutTime: string | null;
  newDepartureDate: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  regCard: { cardNo: string; guestName: string | null };
  requestedBy: { name: string; email: string };
  reviewedBy: { name: string; email: string } | null;
  reviewedAt: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function ExtensionsManager({ requests }: { requests: ExtensionRequest[] }) {
  const router = useRouter();

  async function handleReview(id: string, action: "APPROVED" | "REJECTED") {
    try {
      await reviewExtensionRequest(id, action);
      toast.success(`Extension ${action.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-border bg-neutral-section/50">
            <th className="text-left px-5 py-3 font-medium text-neutral-muted">Card</th>
            <th className="text-left px-5 py-3 font-medium text-neutral-muted">Guest</th>
            <th className="text-left px-5 py-3 font-medium text-neutral-muted">New Checkout</th>
            <th className="text-left px-5 py-3 font-medium text-neutral-muted">New Departure</th>
            <th className="text-left px-5 py-3 font-medium text-neutral-muted">Requested By</th>
            <th className="text-left px-5 py-3 font-medium text-neutral-muted">Status</th>
            <th className="text-right px-5 py-3 font-medium text-neutral-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr><td colSpan={7} className="px-5 py-8 text-center text-neutral-muted">No extension requests</td></tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id} className="border-b border-neutral-border last:border-0">
                <td className="px-5 py-3 font-medium text-brand">{req.regCard.cardNo}</td>
                <td className="px-5 py-3">{req.regCard.guestName}</td>
                <td className="px-5 py-3 text-neutral-muted">{req.newCheckoutTime || "—"}</td>
                <td className="px-5 py-3 text-neutral-muted">
                  {req.newDepartureDate ? new Date(req.newDepartureDate).toLocaleDateString("en-GB") : "—"}
                </td>
                <td className="px-5 py-3 text-neutral-muted">{req.requestedBy.name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {req.status === "PENDING" ? (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleReview(req.id, "APPROVED")}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(req.id, "REJECTED")}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-muted">
                      {req.reviewedBy?.name}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
