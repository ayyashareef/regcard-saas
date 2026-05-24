import { PageHeaderV2, HeaderButton } from "@/components/v2/page-header";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

interface Props {
  users: UserRow[];
}

const TONES = ["#0ea5e9", "#84cc16", "#f97316", "#a855f7", "#ec4899", "#06b6d4"];
function tone(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; }
function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
const ROLE_TAG: Record<string, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: "Super admin", cls: "tag-violet" },
  MANAGER: { label: "Manager", cls: "tag-sky" },
  STAFF: { label: "Staff", cls: "tag-grey" },
};

export function UsersView({ users }: Props) {
  const active = users.filter((u) => u.isActive).length;

  return (
    <div className="page">
      <PageHeaderV2
        eyebrow="Settings · Access"
        title="Users"
        subtitle={`${active} active account${active === 1 ? "" : "s"}. Roles determine what each user can see and edit.`}
        actions={<HeaderButton variant="primary" href="/admin/users">+ Add user</HeaderButton>}
      />

      <div className="panel">
        <div className="panel-h">
          <div className="panel-h-l"><div className="panel-h-t">Operators</div><div className="panel-h-m">{users.length}</div></div>
        </div>
        {users.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 680 }}>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th style={{ width: 80 }}></th></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const role = ROLE_TAG[u.role] ?? { label: u.role, cls: "tag-grey" };
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="tbl-name-cell">
                          <span className="avt" style={{ background: tone(u.id) }}>{initials(u.name)}</span>
                          <span className="tbl-name">{u.name}</span>
                        </div>
                      </td>
                      <td className="mono subtle">{u.email}</td>
                      <td><span className={`tag ${role.cls}`}>{role.label}</span></td>
                      <td className="mono subtle">{fmtDate(u.createdAt)}</td>
                      <td>
                        {u.isActive
                          ? <span className="tag tag-green"><span className="ddot"/> Active</span>
                          : <span className="tag tag-rose"><span className="ddot"/> Inactive</span>}
                      </td>
                      <td><a href="/admin/users" className="tbl-action">Manage</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
