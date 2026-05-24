import { notFound } from "next/navigation";
import { getOrg } from "@/lib/tenant";
import { brandCssVars } from "@/lib/branding";
import LoginForm from "./login-form";

export async function generateMetadata() {
  const org = await getOrg();
  return { title: org?.name ?? "Sign in" };
}

// The slug comes from the middleware-set header (URL was /<slug>/login).
// Validate the org exists and is active before showing the form so a bad
// slug 404s instead of silently failing at sign-in.
export default async function LoginPage() {
  const org = await getOrg();
  if (!org || org.status !== "ACTIVE") notFound();

  const logoUrl = org.logoPath ? `/api/branding/${org.slug}/logo` : null;

  return (
    <div style={brandCssVars(org.primaryColor, org.accentColor)}>
      <LoginForm orgSlug={org.slug} orgName={org.name} logoUrl={logoUrl} />
    </div>
  );
}
