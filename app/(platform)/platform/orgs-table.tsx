"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setOrgStatus } from "@/lib/actions/platform";

interface OrgRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  createdAt: string;
  users: number;
  regCards: number;
  rooms: number;
}

const th = "text-left px-4 py-2.5 font-mono uppercase text-xs text-neutral-muted";
const td = "px-4 py-3 text-sm text-neutral-text border-t border-neutral-border";

export default function OrgsTable({ orgs }: { orgs: OrgRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle(o: OrgRow) {
    const next = o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    start(async () => {
      try {
        await setOrgStatus(o.id, next);
        toast.success(`${o.name} ${next === "ACTIVE" ? "reactivated" : "suspended"}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  if (orgs.length === 0) {
    return <p className="text-neutral-muted text-sm">No organizations yet.</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden">
      <table className="w-full border-collapse">
        <thead style={{ background: "var(--color-cream-2)" }}>
          <tr>
            <th className={th}>Company</th>
            <th className={th}>Address</th>
            <th className={th}>Status</th>
            <th className={th}>Users</th>
            <th className={th}>Cards</th>
            <th className={th}>Created</th>
            <th className={th}></th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((o) => (
            <tr key={o.id}>
              <td className={td}>{o.name}</td>
              <td className={`${td} font-mono`}>/{o.slug}</td>
              <td className={td}>
                <span
                  className="rounded px-2 py-0.5 text-xs font-semibold"
                  style={
                    o.status === "ACTIVE"
                      ? { background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" }
                      : { background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" }
                  }
                >
                  {o.status}
                </span>
              </td>
              <td className={td}>{o.users}</td>
              <td className={td}>{o.regCards}</td>
              <td className={td}>{new Date(o.createdAt).toLocaleDateString("en-GB")}</td>
              <td className={td}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggle(o)}
                  className="text-sm font-semibold hover:underline disabled:opacity-50"
                  style={{ color: o.status === "ACTIVE" ? "var(--color-status-red)" : "var(--color-status-green)" }}
                >
                  {o.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
