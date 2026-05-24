"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/v2/shell-context";
import { useOrg, useOrgPath } from "@/components/org-context";

interface SidebarProps {
  role: string;
  pendingExtensions: number;
  userName: string;
  userEmail: string;
}

interface NavItem {
  href: string;
  label: string;
  roles: string[];
  kbd?: string;
  badgeKey?: "pendingExtensions";
  icon: React.ReactNode;
}

const I = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  ),
  room: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9h20v12H2z"/><path d="M6 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  brand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="11.5" r="2.5"/><circle cx="17.5" cy="13.5" r="2.5"/><path d="M3 21c0-3 2-5 5-5"/></svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
};

const OPERATIONS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["STAFF", "MANAGER", "SUPER_ADMIN"], kbd: "⌘D", icon: I.dashboard },
  { href: "/reg-cards", label: "Reg cards", roles: ["STAFF", "MANAGER", "SUPER_ADMIN"], icon: I.card },
  { href: "/rooms", label: "Rooms", roles: ["MANAGER", "SUPER_ADMIN"], icon: I.room },
  { href: "/extensions", label: "Extensions", roles: ["STAFF", "MANAGER", "SUPER_ADMIN"], badgeKey: "pendingExtensions", icon: I.clock },
];
const INSIGHT: NavItem[] = [
  { href: "/audit", label: "Audit log", roles: ["SUPER_ADMIN"], icon: I.log },
];
const SETTINGS: NavItem[] = [
  { href: "/users", label: "Users", roles: ["MANAGER", "SUPER_ADMIN"], icon: I.users },
  { href: "/admin/branding", label: "Branding", roles: ["SUPER_ADMIN"], icon: I.brand },
];

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";
}

export function SidebarV2({ role, pendingExtensions, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { name: orgName, logoUrl } = useOrg();
  const op = useOrgPath();
  const { collapsed, mobileOpen, setMobileOpen } = useShell();
  const rail = collapsed && !mobileOpen;
  const closeMobile = () => setMobileOpen(false);

  const item = (it: NavItem) => {
    if (!it.roles.includes(role)) return null;
    const href = op(it.href);
    const isActive = pathname === href || (it.href !== "/dashboard" && pathname.startsWith(href));
    const badge = it.badgeKey === "pendingExtensions" && pendingExtensions > 0 ? pendingExtensions : null;
    return (
      <Link key={it.href} href={href} onClick={closeMobile} className={`side-item ${isActive ? "on" : ""}`} title={it.label}>
        <span className="side-item-icon">{it.icon}</span>
        {!rail && (
          <>
            <span className="side-item-label">{it.label}</span>
            {badge != null ? (
              <span className="side-item-count">{badge}</span>
            ) : it.kbd ? (
              <span className="side-item-kbd">{it.kbd}</span>
            ) : null}
          </>
        )}
      </Link>
    );
  };

  const section = (label: string, items: NavItem[]) => {
    const visible = items.filter((it) => it.roles.includes(role));
    if (visible.length === 0) return null;
    return (
      <>
        {!rail && <div className="side-sect">{label}</div>}
        {visible.map(item)}
      </>
    );
  };

  return (
    <aside className={`side ${mobileOpen ? "open" : ""}`}>
      <div className="side-h">
        <div className="side-logo">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={orgName} />
          ) : (
            orgName.charAt(0).toUpperCase()
          )}
        </div>
        {!rail && (
          <div className="side-prop">
            <div className="side-prop-name">{orgName}</div>
            <div className="side-prop-meta">All systems</div>
          </div>
        )}
      </div>

      {!rail && (
        <div className="side-search-wrap">
          <span className="side-search-icon">{I.search}</span>
          <input className="side-search" placeholder="Search anything..." readOnly />
          <kbd>⌘K</kbd>
        </div>
      )}

      <Link href={op("/reg-cards/new")} onClick={closeMobile} className="side-primary" title="New card">
        <span style={{ display: "grid", placeItems: "center", width: 14, height: 14 }}>{I.plus}</span>
        {!rail && <>New card <span className="side-primary-kbd">⌘N</span></>}
      </Link>

      {section("Operations", OPERATIONS)}
      {section("Insight", INSIGHT)}
      {section("Settings", SETTINGS)}

      <div className="side-spacer" />

      <Link href="/api/auth/signout" className="side-user" title="Account">
        <div className="side-user-avatar">{initials(userName)}</div>
        {!rail && (
          <div className="side-user-text">
            <div className="side-user-name">{userName}</div>
            <div className="side-user-email">{userEmail}</div>
          </div>
        )}
      </Link>
    </aside>
  );
}
