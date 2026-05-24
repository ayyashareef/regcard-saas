"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { APP_LOGO } from "@/lib/config";

export default function LoginForm({
  orgSlug,
  orgName,
  logoUrl,
}: {
  orgSlug: string;
  orgName: string;
  logoUrl: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        org: orgSlug,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(`/${orgSlug}/dashboard`);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-border">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={orgName} className="h-20 w-auto max-w-[180px] object-contain" />
          ) : (
            <Image src={APP_LOGO} alt={orgName} width={80} height={80} className="rounded-lg" />
          )}
        </div>
        <h1 className="font-sans font-semibold tracking-tight text-2xl text-brand-deep">{orgName}</h1>
        <p className="text-neutral-muted mt-1 text-sm">Sign in to your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-text mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-text mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition text-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-light active:bg-brand-dark text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
