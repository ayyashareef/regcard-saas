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

/** Perceived brightness 0..1. < 0.5 ⇒ treat as a dark color. */
function brightness(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Foreground colors that stay legible on a given background. Returns a primary
 * text color, a muted variant, and a hairline border — picked light or dark
 * depending on the background's brightness.
 */
export function readableOn(bg: string): {
  fg: string;
  muted: string;
  border: string;
} {
  const dark = brightness(isValidHex(bg) ? bg : "#0f1a2e") < 0.5;
  return dark
    ? { fg: "#f5ecd2", muted: "rgba(255,255,255,.62)", border: "rgba(255,255,255,.10)" }
    : { fg: "#1a2942", muted: "rgba(15,26,46,.60)", border: "rgba(15,26,46,.12)" };
}

/**
 * Derive the full token set from a tenant's primary + accent + sidebar colors.
 * Overriding these on a wrapper element re-themes every descendant that uses
 * `bg-brand` / `var(--color-brand*)` / `var(--color-sidebar*)`.
 */
export function brandCssVars(
  primary: string,
  accent: string,
  sidebar = "#0f1a2e"
): CSSProperties {
  const p = isValidHex(primary) ? primary : "#b8893b";
  const a = isValidHex(accent) ? accent : "#d9b86a";
  const sb = isValidHex(sidebar) ? sidebar : "#0f1a2e";
  const onSidebar = readableOn(sb);
  return {
    "--color-brand": p,
    "--color-brand-light": shade(p, 0.18),
    "--color-brand-soft": a,
    "--color-brand-dark": shade(p, -0.18),
    "--color-brand-deep": shade(p, -0.34),
    "--color-sidebar": sb,
    "--color-sidebar-fg": onSidebar.fg,
    "--color-sidebar-fg-muted": onSidebar.muted,
    "--color-sidebar-border": onSidebar.border,
  } as CSSProperties;
}
