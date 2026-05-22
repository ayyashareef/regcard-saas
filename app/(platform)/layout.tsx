import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePlatformAdmin();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <header
        className="flex items-center justify-between px-6 lg:px-9"
        style={{ height: 64, background: "var(--color-ink)", color: "#e9e3d1" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-brand text-xl" style={{ color: "#f5ecd2" }}>RegCard</span>
          <span className="font-mono uppercase text-xs" style={{ letterSpacing: ".18em", color: "var(--color-brand-soft)" }}>
            Platform
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: "#cfc8b3" }}>{session.user.email}</span>
          <Link href="/api/auth/signout" style={{ color: "var(--color-brand-soft)" }}>Sign out</Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
