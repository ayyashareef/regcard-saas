/**
 * Tenant slug rules. A slug is the `/<slug>/...` URL prefix, so it must not
 * collide with real app route segments or reserved words. Pure module (no
 * Prisma/Node APIs) so it can be imported from Edge middleware too.
 */

// Top-level app route segments — a slug can never equal one of these or the
// router could not tell `/dashboard` (route) from `/dashboard` (a tenant).
export const APP_ROUTES = [
  "dashboard",
  "reg-cards",
  "rooms",
  "users",
  "extensions",
  "audit",
  "admin",
  "login",
] as const;

// Other reserved first-segments / words.
const OTHER_RESERVED = [
  "signup",
  "api",
  "_next",
  "_platform",
  "platform",
  "static",
  "public",
  "assets",
  "favicon",
];

export const RESERVED_SLUGS = new Set<string>([...APP_ROUTES, ...OTHER_RESERVED]);

/** Turn a company name into a candidate slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export interface SlugCheck {
  ok: boolean;
  reason?: string;
}

/** Validate a slug's shape and that it isn't reserved (uniqueness is a DB check). */
export function validateSlug(slug: string): SlugCheck {
  if (!slug) return { ok: false, reason: "Workspace address is required" };
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return {
      ok: false,
      reason: "Use lowercase letters, numbers and hyphens only",
    };
  }
  if (slug.length < 2) return { ok: false, reason: "Too short" };
  if (slug.length > 40) return { ok: false, reason: "Too long" };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: "That address is reserved" };
  return { ok: true };
}
