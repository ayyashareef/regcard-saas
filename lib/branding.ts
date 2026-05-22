import type { CSSProperties } from "react";

/** Clamp + parse a #rrggbb hex into [r,g,b]. Falls back to the default gold. */
function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  const h = m ? m[1] : "b8893b";
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Lighten (percent>0) or darken (percent<0) a hex color. */
export function shade(hex: string, percent: number): string {
  const [r, g, b] = parseHex(hex);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  return toHex([
    r + (t - r) * p,
    g + (t - g) * p,
    b + (t - b) * p,
  ]);
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim());
}

/** Hex → [r,g,b] for consumers like jsPDF that need numeric channels. */
export function hexToRgb(hex: string): [number, number, number] {
  return parseHex(hex);
}

/**
 * Derive the full --color-brand-* token set from a tenant's primary + accent
 * colors. Overriding these on a wrapper element re-themes every descendant
 * that uses `bg-brand` / `text-brand-deep` / `var(--color-brand*)`.
 */
export function brandCssVars(primary: string, accent: string): CSSProperties {
  const p = isValidHex(primary) ? primary : "#b8893b";
  const a = isValidHex(accent) ? accent : "#d9b86a";
  return {
    "--color-brand": p,
    "--color-brand-light": shade(p, 0.18),
    "--color-brand-soft": a,
    "--color-brand-dark": shade(p, -0.18),
    "--color-brand-deep": shade(p, -0.34),
  } as CSSProperties;
}
