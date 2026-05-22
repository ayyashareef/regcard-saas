import { requireOrg } from "@/lib/tenant";
import { getPendingExtensionCount } from "@/lib/actions/extension-requests";
import { AppShellV2 } from "@/components/v2/app-shell";
import { OrgProvider } from "@/components/org-context";
import { brandCssVars } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireOrg(): valid ACTIVE org from URL + a session that belongs to it.
  const { session, org } = await requireOrg();
  const pendingExtensions = await getPendingExtensionCount();

  const logoUrl = org.logoPath ? `/api/branding/${org.slug}/logo` : null;

  return (
    <OrgProvider
      value={{
        slug: org.slug,
        name: org.name,
        logoUrl,
        primaryColor: org.primaryColor,
        accentColor: org.accentColor,
      }}
    >
      {/* Brand CSS vars cascade to every `bg-brand` / var(--color-brand*) below. */}
      <div style={brandCssVars(org.primaryColor, org.accentColor)}>
        <AppShellV2
          role={session.user.role}
          userName={session.user.name || "User"}
          userEmail={session.user.email || ""}
          pendingExtensions={pendingExtensions}
        >
          {children}
        </AppShellV2>
      </div>
    </OrgProvider>
  );
}
