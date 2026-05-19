import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Tenant context for the Node runtime. The middleware has already validated
 * the URL shape and set `x-org-slug`; here we resolve it to a real
 * Organization and enforce that the logged-in user belongs to it.
 */

/** The active tenant slug from the middleware-set header, or null. */
export async function getOrgSlug(): Promise<string | null> {
  const h = await headers();
  return h.get("x-org-slug");
}

/** Resolve the active org record (no auth check). null if slug/org missing. */
export async function getOrg() {
  const slug = await getOrgSlug();
  if (!slug) return null;
  return prisma.organization.findUnique({ where: { slug } });
}

/**
 * Gate a tenant page/action: requires a session, a real ACTIVE org matching
 * the URL, and that the session's org is that org (blocks cross-tenant use
 * even if the cookie is replayed against another slug). Returns the verified
 * session + org.
 */
export async function requireOrg() {
  const slug = await getOrgSlug();
  if (!slug) notFound();

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) notFound();
  if (org.status !== "ACTIVE") {
    // Suspended tenant: bounce to its login (Phase 6 adds a real notice page).
    redirect(`/${slug}/login`);
  }

  const session = await auth();
  if (!session?.user) {
    redirect(`/${slug}/login`);
  }
  if (session.user.orgId !== org.id) {
    // Session belongs to a different tenant — send them home.
    redirect(`/${session.user.orgSlug}/dashboard`);
  }

  return { session, org };
}

/** Like requireOrg() but also enforces a role allow-list. */
export async function requireOrgRole(...roles: string[]) {
  const ctx = await requireOrg();
  if (!roles.includes(ctx.session.user.role)) {
    redirect(`/${ctx.org.slug}/dashboard`);
  }
  return ctx;
}

/**
 * Tenant context for server actions. Unlike requireOrg() this throws plain
 * Errors (matching existing action error handling) instead of redirecting.
 * The scoping key is `session.user.orgId` — it comes from the signed JWT and
 * cannot be spoofed by manipulating the URL. EVERY query/mutation in a server
 * action must filter by the returned `orgId`.
 */
export async function requireTenant() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("Unauthorized");
  return { session, orgId };
}
