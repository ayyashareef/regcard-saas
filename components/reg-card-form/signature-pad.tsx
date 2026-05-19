"use client";

import { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  value?: string;
  onChange: (data: string) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleEnd = useCallback(() => {
    if (sigRef.current) {
      const data = sigRef.current.toDataURL("image/png");
      onChange(data);
    }
  }, [onChange]);

  function handleClear() {
    sigRef.current?.clear();
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-neutral-border rounded-lg bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigRef}
          penColor="#2C2C2C"
          canvasProps={{
            className: "w-full",
            style: { width: "100%", height: "150px" },
          }}
          onEnd={handleEnd}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-muted">Sign above using mouse, touch, or Apple Pencil</span>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-brand hover:text-brand-dark font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
