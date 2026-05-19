import { NextRequest } from "next/server";

/**
 * Mobile auth is DEFERRED. The mobile client must become org-aware before
 * this is rebuilt: login will carry an org slug, the issued JWT will embed
 * `orgId`, and every mobile route will scope by it (the chosen design).
 *
 * Until then these are inert stubs — they keep the public surface compiling
 * and make it impossible for the disabled mobile API to authenticate or
 * leak cross-tenant data. The previous email/password (globally-unique,
 * non-tenant) implementation is in git history.
 */

export interface MobileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
}

const DISABLED = "Mobile API temporarily unavailable";

export async function loginMobile(
  _email: string,
  _password: string
): Promise<{ token: string; user: MobileUser }> {
  throw new Error(DISABLED);
}

export async function validateMobileAuth(
  _req: NextRequest
): Promise<MobileUser | null> {
  return null;
}
