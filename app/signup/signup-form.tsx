"use client";

import { useActionState, useState } from "react";
import { signupOrganization } from "@/lib/actions/signup";
import { slugify } from "@/lib/slug";

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition text-sm";
const labelCls = "block text-sm font-medium text-neutral-text mb-1.5";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signupOrganization, undefined);
  const [company, setCompany] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const effectiveSlug = slugEdited ? slug : slugify(company);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="companyName" className={labelCls}>Company name</label>
        <input
          id="companyName"
          name="companyName"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className={inputCls}
          placeholder="Acme Resort"
        />
      </div>

      <div>
        <label htmlFor="slug" className={labelCls}>Workspace address</label>
        <div className="flex items-center gap-2">
          <span className="text-neutral-muted text-sm font-mono">/</span>
          <input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
            required
            className={`${inputCls} font-mono`}
            placeholder="acme"
          />
        </div>
        <p className="text-neutral-muted mt-1.5 text-xs">
          Your team will sign in at <code className="font-mono">/{effectiveSlug || "your-org"}/login</code>
        </p>
      </div>

      <div>
        <label htmlFor="adminName" className={labelCls}>Your name</label>
        <input id="adminName" name="adminName" required className={inputCls} placeholder="Jane Doe" />
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input id="email" name="email" type="email" required className={inputCls} placeholder="you@example.com" />
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>Password</label>
        <input id="password" name="password" type="password" required minLength={8} className={inputCls} placeholder="At least 8 characters" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand hover:bg-brand-light active:bg-brand-dark text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}
