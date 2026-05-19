import { requireRole } from "@/lib/auth/session";
import { getUsers } from "@/lib/actions/users";
import { UsersView } from "@/components/v2/users/users-view";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole("MANAGER", "SUPER_ADMIN");
  const users = await getUsers();
  return <UsersView users={users} />;
}
