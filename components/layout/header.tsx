"use client";

import { signOut } from "next-auth/react";

interface HeaderProps {
  userName: string;
  userRole: string;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export function Header({ userName, userRole }: HeaderProps) {
  return (
    <header className="h-14 lg:h-16 bg-white border-b border-neutral-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Spacer for hamburger on mobile */}
      <div className="w-10 lg:w-0" />
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-neutral-text">{userName}</div>
          <div className="text-xs text-neutral-muted">{roleLabels[userRole] || userRole}</div>
        </div>
        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-sm">
          {userName?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs lg:text-sm text-neutral-muted hover:text-brand-dark transition-colors px-2 lg:px-3 py-1.5 rounded-md hover:bg-neutral-section"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
