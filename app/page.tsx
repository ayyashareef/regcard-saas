import Link from "next/link";
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
        <Link
          href="/signup"
          className="mt-7 inline-block w-full bg-brand hover:bg-brand-light text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          Create your workspace
        </Link>
        <p className="text-neutral-text mt-5 text-sm">
          Already have one? Sign in at{" "}
          <code className="px-1.5 py-0.5 rounded bg-neutral-section font-mono text-xs">
            /your-org/login
          </code>
        </p>
      </div>
    </main>
  );
}
