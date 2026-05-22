"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateBranding,
  uploadBrandingLogo,
  removeBrandingLogo,
} from "@/lib/actions/branding";

interface Props {
  initial: { name: string; primaryColor: string; accentColor: string; cardNoPrefix: string };
  logoUrl: string | null;
}

const card =
  "bg-white rounded-2xl border border-neutral-border p-6 mb-6 max-w-2xl";
const label = "block text-sm font-medium text-neutral-text mb-1.5";
const input =
  "w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm";

export default function BrandingForm({ initial, logoUrl }: Props) {
  const router = useRouter();
  const [primary, setPrimary] = useState(initial.primaryColor);
  const [accent, setAccent] = useState(initial.accentColor);

  const [settingsState, settingsAction, settingsPending] = useActionState(updateBranding, undefined);
  const [logoState, logoAction, logoPending] = useActionState(uploadBrandingLogo, undefined);
  const [removing, startRemove] = useTransition();

  useEffect(() => {
    if (settingsState?.ok) {
      toast.success("Branding saved");
      router.refresh();
    } else if (settingsState?.error) toast.error(settingsState.error);
  }, [settingsState, router]);

  useEffect(() => {
    if (logoState?.ok) {
      toast.success("Logo updated");
      router.refresh();
    } else if (logoState?.error) toast.error(logoState.error);
  }, [logoState, router]);

  return (
    <>
      {/* Identity + colors */}
      <form action={settingsAction} className={card}>
        <h2 className="font-serif text-lg text-ink mb-4">Identity &amp; colors</h2>

        <div className="mb-4">
          <label htmlFor="name" className={label}>Company name</label>
          <input id="name" name="name" defaultValue={initial.name} required className={input} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="primaryColor" className={label}>Primary color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                className="h-9 w-12 rounded border border-neutral-border" aria-label="Primary color" />
              <input name="primaryColor" value={primary} onChange={(e) => setPrimary(e.target.value)}
                className={`${input} font-mono`} />
            </div>
          </div>
          <div>
            <label htmlFor="accentColor" className={label}>Accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                className="h-9 w-12 rounded border border-neutral-border" aria-label="Accent color" />
              <input name="accentColor" value={accent} onChange={(e) => setAccent(e.target.value)}
                className={`${input} font-mono`} />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="mb-4 flex items-center gap-3 rounded-lg p-3" style={{ background: "var(--color-cream)" }}>
          <span className="text-xs text-neutral-muted">Preview</span>
          <span className="rounded px-3 py-1.5 text-xs font-semibold text-white" style={{ background: primary }}>Primary</span>
          <span className="rounded px-3 py-1.5 text-xs font-semibold" style={{ background: accent, color: "#1a2942" }}>Accent</span>
        </div>

        <div className="mb-4">
          <label htmlFor="cardNoPrefix" className={label}>Card number prefix</label>
          <input id="cardNoPrefix" name="cardNoPrefix" defaultValue={initial.cardNoPrefix}
            maxLength={6} className={`${input} font-mono w-32 uppercase`} />
          <p className="text-neutral-muted mt-1 text-xs">e.g. <span className="font-mono">{initial.cardNoPrefix}-2026-00001</span></p>
        </div>

        <button type="submit" disabled={settingsPending}
          className="bg-brand hover:bg-brand-light text-white font-semibold py-2 px-5 rounded-lg text-sm disabled:opacity-50">
          {settingsPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Logo */}
      <div className={card}>
        <h2 className="font-serif text-lg text-ink mb-4">Logo</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="grid place-items-center h-16 w-16 rounded-lg border border-neutral-border bg-neutral-section overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Current logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-neutral-muted">No logo</span>
            )}
          </div>
          {logoUrl && (
            <button
              type="button"
              disabled={removing}
              onClick={() =>
                startRemove(async () => {
                  const r = await removeBrandingLogo();
                  if (r?.error) toast.error(r.error);
                  else { toast.success("Logo removed"); router.refresh(); }
                })
              }
              className="text-sm text-status-red hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <form action={logoAction} className="flex items-center gap-3">
          <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required className="text-sm" />
          <button type="submit" disabled={logoPending}
            className="bg-ink-2 hover:bg-ink text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50">
            {logoPending ? "Uploading…" : "Upload"}
          </button>
        </form>
        <p className="text-neutral-muted mt-2 text-xs">PNG, JPEG, WebP or SVG · up to 2MB.</p>
      </div>
    </>
  );
}
