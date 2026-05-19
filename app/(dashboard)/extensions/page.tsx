import { requireAuth } from "@/lib/auth/session";
import { getExtensionRequests } from "@/lib/actions/extension-requests";
import { ExtensionsView } from "@/components/v2/extensions/extensions-view";

export const dynamic = "force-dynamic";

export default async function ExtensionsPage() {
  await requireAuth();
  const all = await getExtensionRequests();
  const pending = all.filter((r) => r.status === "PENDING");
  const reviewedCount = all.length - pending.length;
  return <ExtensionsView pending={pending} reviewedCount={reviewedCount} />;
}
