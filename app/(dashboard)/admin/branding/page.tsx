import { requireOrgRole } from "@/lib/tenant";
import { PageHeaderV2 } from "@/components/v2/page-header";
import BrandingForm from "./branding-form";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  // requireOrg() already returns the full Organization record (incl. branding).
  const { org } = await requireOrgRole("SUPER_ADMIN");
  const logoUrl = org.logoPath ? `/api/branding/${org.slug}/logo` : null;

  return (
    <div className="page">
      <PageHeaderV2
        eyebrow="Settings"
        title="Branding"
        subtitle="Customize how RegCard looks for your team and on printed registration cards."
      />
      <BrandingForm
        initial={{
          name: org.name,
          primaryColor: org.primaryColor,
          accentColor: org.accentColor,
          sidebarColor: org.sidebarColor,
          cardNoPrefix: org.cardNoPrefix,
        }}
        logoUrl={logoUrl}
      />
    </div>
  );
}
