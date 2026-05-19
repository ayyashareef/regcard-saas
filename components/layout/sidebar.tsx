"use client";

import type { SVGProps } from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { APP_LOGO, HOTEL_NAME } from "@/lib/config";

interface SidebarProps {
  role: string;
  pendingExtensions?: number;
}

type IconProps = SVGProps<SVGSVGElement>;

function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 12.75h6.5v6.5h-6.5zm8-8h6.5v14.5h-6.5zm-8 0h6.5v5h-6.5z" />
    </svg>
  );
}

function RegCardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.75h14a1.25 1.25 0 0 1 1.25 1.25v10A1.25 1.25 0 0 1 19 18.25H5A1.25 1.25 0 0 1 3.75 17V7A1.25 1.25 0 0 1 5 5.75Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.25 9h9.5M7.25 12h6.5M7.25 15h4" />
    </svg>
  );
}

function PlusSquareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10M7 12h10" />
      <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="3" />
    </svg>
  );
}

function BuildingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.75 19.25h12.5V6.75l-4-2-4 2-4 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M12 10h.01M15 10h.01M9 13.5h.01M12 13.5h.01M15 13.5h.01M11 19.25V16h2v3.25" />
    </svg>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 18.25v-1.1a3.4 3.4 0 0 0-3.4-3.4h-2.2a3.4 3.4 0 0 0-3.4 3.4v1.1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 10.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm7.25 7.5v-.8a2.7 2.7 0 0 0-2.7-2.7H15m.6-4.4a2.35 2.35 0 1 0 0-4.7" />
    </svg>
  );
}

function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="7.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v4l2.75 1.75" />
    </svg>
  );
}

function ClipboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.25h6M9.75 4.75h4.5A1.75 1.75 0 0 1 16 6.5v.25h1.25A1.75 1.75 0 0 1 19 8.5v9.75A1.75 1.75 0 0 1 17.25 20h-10.5A1.75 1.75 0 0 1 5 18.25V8.5a1.75 1.75 0 0 1 1.75-1.75H8V6.5a1.75 1.75 0 0 1 1.75-1.75Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11h7M8.5 14h7M8.5 17h4" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon, roles: ["STAFF", "MANAGER", "SUPER_ADMIN"] },
  { href: "/reg-cards", label: "Reg Cards", icon: RegCardIcon, roles: ["STAFF", "MANAGER", "SUPER_ADMIN"] },
  { href: "/reg-cards/new", label: "New Card", icon: PlusSquareIcon, roles: ["STAFF", "MANAGER", "SUPER_ADMIN"] },
  { href: "/admin/rooms", label: "Rooms", icon: BuildingIcon, roles: ["MANAGER", "SUPER_ADMIN"] },
  { href: "/admin/users", label: "Users", icon: UsersIcon, roles: ["MANAGER", "SUPER_ADMIN"] },
  { href: "/admin/checkout-extensions", label: "Extensions", icon: ClockIcon, roles: ["STAFF", "MANAGER", "SUPER_ADMIN"], badge: true },
  { href: "/admin/audit-log", label: "Audit Log", icon: ClipboardIcon, roles: ["SUPER_ADMIN"] },
];

export function Sidebar({ role, pendingExtensions = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image src={APP_LOGO} alt={HOTEL_NAME} width={40} height={40} className="rounded" style={{ height: "auto" }} />
          <div>
            <h1 className="font-brand text-white text-lg leading-tight">{HOTEL_NAME}</h1>
            <span className="text-brand-soft text-xs font-medium tracking-wider uppercase">RegCard</span>
          </div>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-white/70 hover:text-white p-1"
          aria-label="Close menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand/20 text-brand-soft"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && pendingExtensions > 0 && (
                  <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingExtensions}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-white/40 text-xs text-center">
          © {new Date().getFullYear()} {HOTEL_NAME}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 bg-accent-navy text-white p-2 rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-accent-navy flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-accent-navy min-h-screen flex-col shrink-0">
        {navContent}
      </aside>
    </>
  );
}
