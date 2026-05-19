"use client";

import { usePathname } from "next/navigation";
import { useShell } from "@/components/v2/shell-context";
import { useOrg } from "@/components/org-context";

interface TopbarProps {
  userName: string;
  userEmail: string;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  "reg-cards": "Registration Cards",
  rooms: "Rooms",
  users: "Users",
  extensions: "Extensions",
  audit: "Audit Log",
};

// pathname is `/<slug>/<view>/...`; the view is the segment AFTER the slug.
function pickViewTitle(pathname: string, slug: string): string {
  const segs = pathname.split("/").filter(Boolean);
  const seg = segs[0] === slug ? segs[1] : segs[0];
  return VIEW_TITLES[seg ?? "dashboard"] ?? "Dashboard";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

const HAMBURGER = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
);

const ICON_BTN_STYLE: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 8,
  border: "1px solid var(--color-line)",
  background: "#fff",
  color: "var(--color-ink-2)",
  flexShrink: 0,
};

export function TopbarV2({ userName, userEmail }: TopbarProps) {
  const { toggleCollapsed, toggleMobile } = useShell();
  const { slug } = useOrg();
  const pathname = usePathname();
  const currentView = pickViewTitle(pathname, slug);
  const today = formatDate(new Date());

  return (
    <div
      className="flex items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-6 lg:px-9"
      style={{
        height: 72,
        background: "var(--color-paper)",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      {/* Mobile: opens the off-canvas drawer */}
      <button
        onClick={toggleMobile}
        aria-label="Open menu"
        className="grid cursor-pointer place-items-center lg:hidden"
        style={ICON_BTN_STYLE}
      >
        {HAMBURGER}
      </button>
      {/* Desktop: collapses the sidebar to an icon rail */}
      <button
        onClick={toggleCollapsed}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
        className="hidden cursor-pointer place-items-center lg:grid"
        style={ICON_BTN_STYLE}
      >
        {HAMBURGER}
      </button>

      <div
        className="hidden items-center gap-2.5 font-mono uppercase md:flex"
        style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--color-text-soft)" }}
      >
        <span>Front Desk</span>
        <span style={{ color: "var(--color-line-2)" }}>/</span>
        <span style={{ color: "var(--color-ink-2)", fontWeight: 600 }}>{currentView}</span>
      </div>

      <div className="relative hidden flex-1 md:block" style={{ marginLeft: 16, maxWidth: 360 }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            width: 14,
            height: 14,
            color: "#a39786",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          placeholder="Search guests, rooms, card numbers…"
          aria-label="Search"
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            border: "1px solid var(--color-line)",
            background: "rgba(255,255,255,.6)",
            borderRadius: 6,
            fontSize: 13,
            color: "var(--color-neutral-text)",
            outline: "none",
          }}
        />
      </div>

      {/* On mobile the breadcrumb/search are hidden, so push the user chip right */}
      <div className="ml-auto flex items-center gap-3 lg:gap-[18px]">
        <div
          className="hidden font-mono uppercase lg:flex"
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            color: "var(--color-text-soft)",
            borderRight: "1px solid var(--color-line)",
            paddingRight: 18,
            alignItems: "baseline",
            gap: 6,
          }}
        >
          Date <b style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-ink-2)", letterSpacing: 0 }}>{today}</b>
        </div>

        <div
          className="flex items-center gap-2.5"
          style={{
            padding: "6px 6px 6px 6px",
            border: "1px solid var(--color-line)",
            borderRadius: 40,
            background: "#fff",
          }}
        >
          <div
            className="grid place-items-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(150deg,#f3e2b3,#b8893b)",
              color: "var(--color-ink-2)",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {initials(userName) || "U"}
          </div>
          <div className="hidden flex-col leading-tight pr-2 sm:flex">
            <b style={{ fontSize: 12.5, color: "var(--color-ink-2)", fontWeight: 600 }}>{userName}</b>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--color-text-soft)" }}
            >
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
