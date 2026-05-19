import { requireRole } from "@/lib/auth/session";
import { getUsers } from "@/lib/actions/users";
import { UsersManager } from "@/components/admin/users-manager";

export default async function UsersPage() {
  const session = await requireRole("MANAGER", "SUPER_ADMIN");
  const users = await getUsers();

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-deep">Manage Users</h2>
        <p className="text-neutral-muted text-sm mt-1">{users.length} users</p>
      </div>
      <UsersManager users={serialized} currentRole={session.user.role} />
    </div>
  );
}
