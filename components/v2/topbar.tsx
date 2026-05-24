"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/v2/shell-context";
import { useOrg } from "@/components/org-context";

interface TopbarProps {
  userName: string;
  userEmail: string;
}

const CRUMBS: Record<string, [string, string]> = {
  dashboard: ["Front desk", "Dashboard"],
  "reg-cards": ["Front desk", "Reg cards"],
  rooms: ["Front desk", "Rooms"],
  extensions: ["Front desk", "Extensions"],
  audit: ["Insight", "Audit log"],
  users: ["Settings", "Users"],
  admin: ["Settings", "Branding"],
};

const HAMBURGER = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const SEARCH = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const BELL = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
);

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TopbarV2({ userName }: TopbarProps) {
  const { toggleCollapsed, toggleMobile } = useShell();
  const { slug } = useOrg();
  const pathname = usePathname();

  // Client-only clock to avoid SSR/CSR hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const segs = pathname.split("/").filter(Boolean);
  const view = (segs[0] === slug ? segs[1] : segs[0]) ?? "dashboard";
  const [base, here] = CRUMBS[view] ?? ["Front desk", "Dashboard"];

  return (
    <div className="topbar">
      <button
        className="tb-icon"
        aria-label="Toggle menu"
        onClick={() => {
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches) toggleMobile();
          else toggleCollapsed();
        }}
      >
        {HAMBURGER}
      </button>

      <div className="crumbs">
        <button>{base}</button>
        <span className="sep">/</span>
        <span className="here">{here}</span>
      </div>

      <div className="kbar">
        <span className="kbar-ico">{SEARCH}</span>
        <input placeholder="Search guests, rooms, cards, or run a command..." aria-label="Search" />
        <kbd>⌘K</kbd>
      </div>

      <div className="tb-status">Live</div>
      <button className="tb-icon" aria-label="Notifications" title={`Signed in as ${userName}`}>
        {BELL}
        <span className="dot" />
      </button>
      <div className="tb-date">
        {now && (
          <>
            <span>{DOW[now.getDay()]}</span>
            <strong>{`${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}`}</strong>
            <span className="sep">·</span>
            <strong className="mono">{`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`}</strong>
          </>
        )}
      </div>
    </div>
  );
}
