"use client";

import { createContext, useContext } from "react";
import { orgPath } from "@/lib/org-path";

interface OrgContextValue {
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

/**
 * Makes the current tenant (slug, name, logo, brand colors) available to
 * client components so links can be org-prefixed and the sidebar/login can
 * render the tenant's identity. Seeded once by the dashboard server layout.
 */
const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  value,
  children,
}: {
  value: OrgContextValue;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
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
