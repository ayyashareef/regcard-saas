/**
 * Pure helper: prefix an app path with the current tenant slug.
 *
 * Path-based tenancy means every in-app URL the browser sees is
 * `/<slug><path>` (e.g. `/acme/dashboard`). The middleware strips the
 * `/<slug>` prefix before Next routing, so route files stay unprefixed —
 * but links/redirects the browser follows MUST include the slug.
 *
 * Always build internal hrefs with `orgPath(slug, "/dashboard")` instead of
 * hard-coding `/dashboard`.
 */
export function orgPath(slug: string, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // `/acme` + `/` -> `/acme` (avoid trailing slash); `/acme` + `/x` -> `/acme/x`
  if (clean === "/") return `/${slug}`;
  return `/${slug}${clean}`;
}

/** First path segment of a URL pathname, or "" if none. */
export function firstSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}
