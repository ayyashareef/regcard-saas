"use client";

import { ShellProvider, useShell } from "@/components/v2/shell-context";
import { SidebarV2 } from "@/components/v2/sidebar";
import { TopbarV2 } from "@/components/v2/topbar";

interface AppShellProps {
  role: string;
  userName: string;
  userEmail: string;
  pendingExtensions: number;
  children: React.ReactNode;
}

function ShellLayout(props: AppShellProps) {
  const { collapsed, mobileOpen, setMobileOpen } = useShell();
  return (
    <div
      className="min-h-screen lg:grid transition-[grid-template-columns] duration-200"
      style={{
        // Grid only kicks in at lg (display:grid via the class); this inline
        // gridTemplateColumns is ignored on mobile where the div is block.
        gridTemplateColumns: collapsed ? "72px 1fr" : "260px 1fr",
        background: "var(--color-cream)",
      }}
    >
      <SidebarV2 role={props.role} pendingExtensions={props.pendingExtensions} />

      {/* Mobile backdrop when the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-w-0 flex-col" style={{ background: "var(--color-cream)" }}>
        <TopbarV2 userName={props.userName} userEmail={props.userEmail} />
        <main className="flex-1 overflow-auto" style={{ background: "var(--color-cream)" }}>
          {props.children}
        </main>
      </div>
    </div>
  );
}

export function AppShellV2(props: AppShellProps) {
  return (
    <ShellProvider>
      <ShellLayout {...props} />
    </ShellProvider>
  );
}
