import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { APP_ROUTES as APP_ROUTE_LIST } from "@/lib/slug";
import { NextResponse } from "next/server";

// Edge-safe NextAuth instance: authConfig has no Prisma/bcrypt, and with the
// JWT session strategy `req.auth` is decoded from the cookie without a DB hit.
const { auth } = NextAuth(authConfig);

// First path segments that are real app routes, NOT tenant slugs. The tenant
// route space is `/<slug>/<one-of-these>/...`. Shared with signup validation
// (lib/slug.ts) so a slug can never collide with a route.
const APP_ROUTES = new Set<string>(APP_ROUTE_LIST);

// Non-tenant public segments.
const PUBLIC_TOP = new Set(["", "signup"]);

/**
 * Path-based multitenancy with a self-healing fallback.
 *
 * Canonical URLs are `/<slug>/<path>`. The middleware:
 *  - validates the slug prefix, gates auth per-tenant, blocks cross-tenant
 *    access, then rewrites to the real (unprefixed) route, passing the slug
 *    to the Node runtime via `x-org-slug`;
 *  - if a request arrives WITHOUT a slug but at a known app route (a bare
 *    link like `/reg-cards`), an authenticated user is redirected to the
 *    canonical `/<their-slug>/reg-cards`. This lets existing root-relative
 *    links keep working without rewriting every call site.
 *
 * Org existence/status is verified server-side in lib/tenant.ts (Edge can't
 * reach Prisma).
 */
export default auth((req) => {
  const { nextUrl } = req;
  const segments = nextUrl.pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const search = nextUrl.search;
  const isLoggedIn = !!req.auth;
  const userSlug = req.auth?.user?.orgSlug;

  // --- Public root / signup -------------------------------------------
  if (PUBLIC_TOP.has(first)) {
    if (first === "" && isLoggedIn && userSlug) {
      return NextResponse.redirect(new URL(`/${userSlug}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // --- Bare app route (no slug) — self-heal to canonical URL ----------
  if (APP_ROUTES.has(first)) {
    if (first === "login") {
      // No global login; bounce to root.
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (isLoggedIn && userSlug) {
      return NextResponse.redirect(
        new URL(`/${userSlug}${nextUrl.pathname}${search}`, req.url)
      );
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- Platform-operator area (not a tenant) -------------------------
  if (first === "platform") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/_platform/login", req.url));
    }
    if (req.auth?.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(
        new URL(userSlug ? `/${userSlug}/dashboard` : "/", req.url)
      );
    }
    return NextResponse.next();
  }

  // --- Tenant routes: `first` is an org slug -------------------------
  const slug = first;
  const innerPath = "/" + segments.slice(1).join("/");
  const isLoginPage = innerPath === "/login";

  // A logged-in user may only access their own org.
  if (isLoggedIn && userSlug && userSlug !== slug) {
    return NextResponse.redirect(
      new URL(`/${userSlug}/dashboard`, req.url)
    );
  }
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL(`/${slug}/login`, req.url));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${slug}/dashboard`, req.url));
  }

  // Rewrite to the real route; `/<slug>` (no inner path) -> dashboard.
  const target = innerPath === "/" ? "/dashboard" : innerPath;
  const rewriteUrl = new URL(target + search, req.url);
  const headers = new Headers(req.headers);
  headers.set("x-org-slug", slug);
  return NextResponse.rewrite(rewriteUrl, { request: { headers } });
});

export const config = {
  matcher: [
    // Auth-gate everything except API routes, Next internals, and static assets.
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
