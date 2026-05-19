import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Public root (no tenant). Middleware already redirects authenticated users
 * to their workspace; this handles the unauthenticated landing. Real
 * marketing + self-serve signup land here in Phase 4.
 */
export default async function Home() {
  const session = await auth();
  if (session?.user?.orgSlug) {
    redirect(`/${session.user.orgSlug}/dashboard`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-section px-4">
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-xl p-10 border border-neutral-border">
        <h1 className="font-brand text-3xl text-brand-deep">RegCard</h1>
        <p className="text-neutral-muted mt-3 text-sm">
          Guest registration, multi-tenant.
        </p>
        <p className="text-neutral-text mt-6 text-sm">
          Go to your organization workspace at{" "}
          <code className="px-1.5 py-0.5 rounded bg-neutral-section font-mono text-xs">
            /your-org
          </code>
        </p>
        <p className="text-neutral-muted mt-2 text-xs">
          Self-serve signup is coming soon.
        </p>
      </div>
    </main>
  );
}
