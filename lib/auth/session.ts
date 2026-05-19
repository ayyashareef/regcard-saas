import { auth } from "@/lib/auth";
import { requireOrg, requireOrgRole } from "@/lib/tenant";

export async function getSession() {
  return auth();
}

/**
 * Tenant-aware auth guard. Delegates to requireOrg() so every caller also
 * gets org existence + cross-tenant enforcement and org-correct redirects
 * (to `/<slug>/login` instead of a global `/login`).
 */
export async function requireAuth() {
  const { session } = await requireOrg();
  return session;
}

export async function requireRole(...roles: string[]) {
  const { session } = await requireOrgRole(...roles);
  return session;
}
