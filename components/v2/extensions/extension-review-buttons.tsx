"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reviewExtensionRequest } from "@/lib/actions/extension-requests";

interface Props {
  requestId: string;
}

export function ExtensionReviewButtons({ requestId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "APPROVED" | "REJECTED">(null);

  async function review(action: "APPROVED" | "REJECTED") {
    setBusy(action);
    try {
      await reviewExtensionRequest(requestId, action);
      toast.success(action === "APPROVED" ? "Extension approved" : "Extension declined");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const disabled = pending || busy !== null;

  return (
    <div className="row" style={{ gap: 8, flexShrink: 0 }}>
      <button type="button" className="btn ghost sm" disabled={disabled} onClick={() => review("REJECTED")}>
        {busy === "REJECTED" ? "Declining…" : "Decline"}
      </button>
      <button type="button" className="btn primary sm" disabled={disabled} onClick={() => review("APPROVED")}>
        {busy === "APPROVED" ? "Approving…" : "Approve"}
      </button>
    </div>
  );
}
