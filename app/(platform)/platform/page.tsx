import { listOrganizations } from "@/lib/actions/platform";
import OrgsTable from "./orgs-table";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const orgs = await listOrganizations();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Organizations</h1>
        <p className="text-neutral-muted mt-1 text-sm">
          {orgs.length} tenant{orgs.length === 1 ? "" : "s"} · suspend to immediately block access.
        </p>
      </div>
      <OrgsTable
        orgs={orgs.map((o) => ({
          id: o.id,
          slug: o.slug,
          name: o.name,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
          users: o._count.users,
          regCards: o._count.regCards,
          rooms: o._count.rooms,
        }))}
      />
    </div>
  );
}
