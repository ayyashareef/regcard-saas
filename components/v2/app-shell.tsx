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
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <SidebarV2
        role={props.role}
        pendingExtensions={props.pendingExtensions}
        userName={props.userName}
        userEmail={props.userEmail}
      />

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          style={{ display: "block" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="main">
        <TopbarV2 userName={props.userName} userEmail={props.userEmail} />
        <div className="scroll">{props.children}</div>
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
