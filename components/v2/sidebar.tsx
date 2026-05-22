"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/v2/shell-context";
import { useOrg, useOrgPath } from "@/components/org-context";

// Flower mark only (transparent, cream). The "Unima Grand" wordmark is rendered
// as live text in the Rossetti brand font (--font-brand) so it can be coloured
// for the dark sidebar instead of being baked into a PNG.
const FLOWER_MARK = "/unima-flower.png";

interface SidebarProps {
  role: string;
  pendingExtensions: number;
}

interface NavItem {
  href: string;
  label: string;
  hint?: string;
  roles: string[];
  badgeKey?: "pendingExtensions";
  icon: React.ReactNode;
}

const operations: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    hint: "⌘D",
    roles: ["STAFF", "MANAGER", "SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
    ),
  },
  {
    href: "/reg-cards",
    label: "Reg Cards",
    roles: ["STAFF", "MANAGER", "SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
    ),
  },
  {
    href: "/reg-cards/new",
    label: "New Card",
    hint: "+N",
    roles: ["STAFF", "MANAGER", "SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    ),
  },
  {
    href: "/rooms",
    label: "Rooms",
    roles: ["MANAGER", "SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9h20v12H2z" /><path d="M6 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>
    ),
  },
  {
    href: "/users",
    label: "Users",
    roles: ["MANAGER", "SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    href: "/extensions",
    label: "Extensions",
    roles: ["STAFF", "MANAGER", "SUPER_ADMIN"],
    badgeKey: "pendingExtensions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
    ),
  },
  {
    href: "/audit",
    label: "Audit Log",
    roles: ["SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
    ),
  },
  {
    href: "/admin/branding",
    label: "Branding",
    roles: ["SUPER_ADMIN"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6.5" cy="11.5" r="2.5" /><circle cx="17.5" cy="13.5" r="2.5" /><path d="M3 21c0-3 2-5 5-5" /></svg>
    ),
  },
];

export function SidebarV2({ role, pendingExtensions }: SidebarProps) {
  const pathname = usePathname();
  const { name: orgName, logoUrl } = useOrg();
  const op = useOrgPath();
  const { collapsed, mobileOpen, setMobileOpen } = useShell();
  const closeMobile = () => setMobileOpen(false);

  // The icon-rail (collapsed) layout is a desktop affordance only. On mobile the
  // drawer always shows the full sidebar.
  const rail = collapsed && !mobileOpen;

  const visible = operations.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col overflow-x-hidden overflow-y-auto border-r transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        background: "var(--color-ink)",
        color: "#e9e3d1",
        borderRightColor: "#000",
      }}
    >
      <div
        className={`flex flex-col items-center text-center ${rail ? "gap-0 px-0 py-5" : "gap-2.5 px-6 pt-6 pb-5"}`}
        style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}
      >
        <Link
          href={op("/dashboard")}
          aria-label={orgName}
          onClick={closeMobile}
          className="flex flex-col items-center gap-2"
        >
          {logoUrl ? (
            // Tenant-uploaded logo (served from the public branding route).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={orgName}
              style={{ width: rail ? 30 : 48, height: "auto", maxHeight: rail ? 30 : 56, objectFit: "contain" }}
            />
          ) : (
            <Image
              src={FLOWER_MARK}
              alt=""
              width={143}
              height={99}
              style={{ width: rail ? 30 : 48, height: "auto" }}
              priority
            />
          )}
          {!rail && (
            <span
              className="font-brand leading-none"
              style={{
                fontSize: 26,
                color: "#f5ecd2",
                letterSpacing: ".01em",
              }}
            >
              {orgName}
            </span>
          )}
        </Link>
        {!rail && (
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.32em",
              color: "var(--color-brand-soft)",
            }}
          >
            Reg · Card
          </div>
        )}
      </div>

      {!rail && (
        <div
          className="font-mono uppercase"
          style={{
            padding: "22px 24px 10px",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "rgba(217,184,106,.55)",
          }}
        >
          Operations
        </div>
      )}

      <nav className={`flex flex-col gap-0.5 ${rail ? "px-2.5 pt-4" : "px-3 pt-0"}`}>
        {visible.map((item) => {
          const href = op(item.href);
          const isActive =
            pathname === href ||
            (item.href !== "/dashboard" && pathname.startsWith(href));
          const badge =
            item.badgeKey === "pendingExtensions" && pendingExtensions > 0
              ? pendingExtensions
              : null;
          return (
            <Link
              key={item.href}
              href={href}
              onClick={closeMobile}
              className={`flex items-center rounded-md transition-colors ${
                rail ? "justify-center py-3 px-0 gap-0" : "gap-3 px-3.5 py-2.5"
              }`}
              style={{
                color: isActive ? "#f5ecd2" : "#cfc8b3",
                fontSize: 13.5,
                fontWeight: 500,
                letterSpacing: ".01em",
                background: isActive
                  ? "linear-gradient(90deg, rgba(184,137,59,.22), rgba(184,137,59,.06))"
                  : "transparent",
                boxShadow: isActive ? "inset 2px 0 0 var(--color-brand)" : "none",
              }}
            >
              <span
                className="grid place-items-center w-[18px] h-[18px]"
                style={{
                  color: "var(--color-brand-soft)",
                  opacity: isActive ? 1 : 0.85,
                }}
              >
                {item.icon}
              </span>
              {!rail && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {badge !== null ? (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 12,
                        background: "var(--color-brand)",
                        color: "#0f1a2e",
                        fontWeight: 700,
                      }}
                    >
                      {badge}
                    </span>
                  ) : item.hint ? (
                    <span
                      className="font-mono"
                      style={{ fontSize: 10, opacity: 0.4, marginLeft: "auto" }}
                    >
                      {item.hint}
                    </span>
                  ) : null}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {!rail && (
        <div
          className="font-mono uppercase"
          style={{
            padding: "22px 24px 10px",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "rgba(217,184,106,.55)",
          }}
        >
          Account
        </div>
      )}

      <nav className={`flex flex-col gap-0.5 ${rail ? "px-2.5" : "px-3"}`}>
        <Link
          href="/api/auth/signout"
          onClick={closeMobile}
          className={`flex items-center rounded-md ${
            rail ? "justify-center py-3 px-0 gap-0" : "gap-3 px-3.5 py-2.5"
          }`}
          style={{ color: "#cfc8b3", fontSize: 13.5, fontWeight: 500 }}
        >
          <span
            className="grid place-items-center w-[18px] h-[18px]"
            style={{ color: "var(--color-brand-soft)", opacity: 0.85 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </span>
          {!rail && <span className="flex-1">Sign Out</span>}
        </Link>
      </nav>

      <div
        className={`mt-auto font-mono uppercase flex ${rail ? "justify-center" : "justify-between"}`}
        style={{
          padding: rail ? "18px 0" : "18px 24px",
          borderTop: "1px solid rgba(255,255,255,.07)",
          fontSize: 10,
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,.35)",
        }}
      >
        <span>v3.4.1</span>
        {!rail && <span>{orgName}</span>}
      </div>
    </aside>
  );
}
