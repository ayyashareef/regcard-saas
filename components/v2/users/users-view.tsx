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

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", bg: "rgba(26,41,66,.1)", color: "var(--color-ink-2)" },
  MANAGER: { label: "Manager", bg: "rgba(15,118,110,.12)", color: "var(--color-accent-teal)" },
  STAFF: { label: "Staff", bg: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" },
};

const TH: React.CSSProperties = {
  padding: "12px 20px",
  fontSize: 10.5,
  letterSpacing: ".16em",
  color: "var(--color-text-soft)",
  background: "rgba(184,137,59,.05)",
  fontWeight: 600,
  borderBottom: "1px solid var(--color-line)",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const TD: React.CSSProperties = { padding: "14px 20px", borderBottom: "1px solid var(--color-line)", verticalAlign: "middle" };

export function UsersView({ users }: Props) {
  const active = users.filter((u) => u.isActive).length;

  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <PageHeaderV2
        eyebrow="Access · Permissions"
        title="Manage users"
        subtitle={`${active} active account${active === 1 ? "" : "s"}. Roles determine what each user can see and edit.`}
        actions={<HeaderButton variant="primary">+ Add user</HeaderButton>}
      />

      <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10, overflow: "hidden" }}>
        {users.length === 0 ? (
          <div className="text-center" style={{ padding: "56px 22px", color: "var(--color-text-soft)", fontSize: 13 }}>
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Name", "Email", "Role", "Joined", "Status", ""].map((h, i) => (
                    <th key={i} style={{ ...TH, textAlign: i === 5 ? "right" : "left" }} className="font-mono uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const role = ROLE_META[u.role] ?? { label: u.role, bg: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" };
                  return (
                    <tr key={u.id}>
                      <td style={TD}>
                        <div className="flex items-center gap-2.5">
                          <div className="grid place-items-center" style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--color-ink-2)", color: "#f5ecd2", fontSize: 11, fontWeight: 600 }}>{initials(u.name)}</div>
                          <div className="min-w-0">
                            <div className="truncate" style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: 13 }}>{u.name}</div>
                            <div className="font-mono" style={{ fontSize: 10.5, color: "var(--color-text-soft)", letterSpacing: ".04em" }}>Created {fmtDate(u.createdAt)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-ink-2)" }} className="font-mono">{u.email}</td>
                      <td style={TD}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, letterSpacing: ".04em", background: role.bg, color: role.color }}>{role.label}</span>
                      </td>
                      <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--color-ink-2)" }} className="font-mono">{fmtDate(u.createdAt)}</td>
                      <td style={TD}>
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5" style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" }}>
                            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5" style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" }}>
                            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ ...TD, textAlign: "right", whiteSpace: "nowrap" }}>
                        <a href="/admin/users" className="hover:underline" style={{ fontSize: 12.5, color: "var(--color-ink-2)", fontWeight: 600, textDecoration: "none" }}>Manage</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono uppercase" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--color-text-soft)" }}>
        Edit / deactivate / add — use the admin console for now ·{" "}
        <a href="/admin/users" className="underline" style={{ color: "var(--color-brand-deep)" }}>open</a>
      </p>
    </div>
  );
}
