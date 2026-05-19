import { notFound } from "next/navigation";
import { getOrg } from "@/lib/tenant";
import LoginForm from "./login-form";

// The slug comes from the middleware-set header (URL was /<slug>/login).
// Validate the org exists and is active before showing the form so a bad
// slug 404s instead of silently failing at sign-in.
export default async function LoginPage() {
  const org = await getOrg();
  if (!org || org.status !== "ACTIVE") notFound();

  return <LoginForm orgSlug={org.slug} orgName={org.name} />;
}
