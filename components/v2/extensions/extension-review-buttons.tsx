"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reviewExtensionRequest } from "@/lib/actions/extension-requests";

interface Props {
  requestId: string;
}

const baseStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 6,
  border: "1px solid var(--color-line-2)",
  background: "#fff",
  color: "var(--color-ink-2)",
  fontSize: 13,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const primaryStyle: React.CSSProperties = {
  ...baseStyle,
  background: "var(--color-ink-2)",
  color: "#f5ecd2",
  borderColor: "var(--color-ink-2)",
};

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
    <div className="flex flex-shrink-0 flex-wrap gap-2">
      <button
        type="button"
        style={{ ...baseStyle, opacity: disabled ? 0.6 : 1 }}
        disabled={disabled}
        onClick={() => review("REJECTED")}
      >
        {busy === "REJECTED" ? "Declining…" : "Decline"}
      </button>
      <button
        type="button"
        style={{ ...primaryStyle, opacity: disabled ? 0.6 : 1 }}
        disabled={disabled}
        onClick={() => review("APPROVED")}
      >
        {busy === "APPROVED" ? "Approving…" : "Approve"}
      </button>
    </div>
  );
}
