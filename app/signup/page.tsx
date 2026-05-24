import Link from "next/link";
import SignupForm from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-section px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-brand text-3xl text-brand-deep">Create your workspace</h1>
          <p className="text-neutral-muted mt-2 text-sm">
            Set up RegCard for your company in a minute.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-border">
          <SignupForm />
        </div>
        <p className="text-center text-neutral-muted mt-5 text-sm">
          Already have a workspace? Sign in at{" "}
          <code className="font-mono text-xs">/your-org/login</code>
        </p>
      </div>
    </main>
  );
}
