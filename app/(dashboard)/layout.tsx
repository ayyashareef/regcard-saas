import { requireOrg } from "@/lib/tenant";
import { getPendingExtensionCount } from "@/lib/actions/extension-requests";
import { AppShellV2 } from "@/components/v2/app-shell";
import { OrgProvider } from "@/components/org-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireOrg(): valid ACTIVE org from URL + a session that belongs to it.
  const { session, org } = await requireOrg();
  // NOTE: still globally scoped until Phase 3 (query isolation).
  const pendingExtensions = await getPendingExtensionCount();

  return (
    <OrgProvider slug={org.slug} name={org.name}>
      <AppShellV2
        role={session.user.role}
        userName={session.user.name || "User"}
        userEmail={session.user.email || ""}
        pendingExtensions={pendingExtensions}
      >
        {children}
      </AppShellV2>
    </OrgProvider>
  );
}
