"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "unima-v2-collapsed";

interface ShellState {
  /** Desktop: sidebar narrowed to an icon rail. Persisted to localStorage. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile: off-canvas sidebar drawer is open. Not persisted. */
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggleMobile: () => void;
}

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration sync from localStorage
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <ShellContext.Provider
      value={{ collapsed, toggleCollapsed, mobileOpen, setMobileOpen, toggleMobile }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside ShellProvider");
  return ctx;
}
