"use client";

import { createContext, useContext } from "react";
import { orgPath } from "@/lib/org-path";

/**
 * Makes the current tenant slug available to client components so links and
 * client-side navigation can be org-prefixed. Seeded once by the dashboard
 * server layout (which reads the slug from the middleware-set header).
 */
const OrgContext = createContext<{ slug: string; name: string } | null>(null);

export function OrgProvider({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <OrgContext.Provider value={{ slug, name }}>{children}</OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within an <OrgProvider>");
  }
  return ctx;
}

/** Returns a function that prefixes a path with the active tenant slug. */
export function useOrgPath() {
  const { slug } = useOrg();
  return (path: string) => orgPath(slug, path);
}
