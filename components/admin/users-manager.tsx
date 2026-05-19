"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser, updateUser } from "@/lib/actions/users";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function UsersManager({ users, currentRole }: { users: User[]; currentRole: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [loading, setLoading] = useState(false);

  const availableRoles = currentRole === "SUPER_ADMIN"
    ? ["STAFF", "MANAGER", "SUPER_ADMIN"]
    : ["STAFF"];

  function openNew() {
    setEditUser(null);
    setForm({ name: "", email: "", password: "", role: "STAFF" });
    setShowForm(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editUser) {
        const data: Record<string, string | boolean> = { name: form.name, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await updateUser(editUser.id, data);
        toast.success("User updated");
      } else {
        if (!form.password) {
          toast.error("Password is required");
          setLoading(false);
          return;
        }
        await createUser(form);
        toast.success("User created");
      }
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(user: User) {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? "User deactivated" : "User activated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    MANAGER: "Manager",
    STAFF: "Staff",
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light transition">
          + Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
          <h3 className="font-semibold text-brand-deep">{editUser ? `Edit ${editUser.name}` : "New User"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">
                Password {editUser ? "(leave blank to keep)" : "*"}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
                {availableRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light disabled:opacity-50 transition">
              {loading ? "Saving…" : editUser ? "Update" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-neutral-border text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-neutral-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-border bg-neutral-section/50">
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Name</th>
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Email</th>
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Role</th>
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Status</th>
              <th className="text-right px-5 py-3 font-medium text-neutral-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-neutral-border last:border-0">
                <td className="px-5 py-3 font-medium">{user.name}</td>
                <td className="px-5 py-3 text-neutral-muted">{user.email}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-navy/10 text-accent-navy">
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(user)} className="text-brand hover:text-brand-dark text-xs font-medium">Edit</button>
                  <button onClick={() => handleToggle(user)} className="text-neutral-muted hover:text-neutral-text text-xs font-medium">
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
