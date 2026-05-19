"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRoom, updateRoom, deleteRoom } from "@/lib/actions/rooms";

interface Room {
  id: string;
  number: string;
  floor: string | null;
  type: string | null;
  isActive: boolean;
  createdAt: string;
}

export function RoomsManager({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({ number: "", floor: "", type: "" });
  const [loading, setLoading] = useState(false);

  function openNew() {
    setEditRoom(null);
    setForm({ number: "", floor: "", type: "" });
    setShowForm(true);
  }

  function openEdit(room: Room) {
    setEditRoom(room);
    setForm({ number: room.number, floor: room.floor || "", type: room.type || "" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editRoom) {
        await updateRoom(editRoom.id, form);
        toast.success("Room updated");
      } else {
        await createRoom(form);
        toast.success("Room created");
      }
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(room: Room) {
    try {
      await updateRoom(room.id, { isActive: !room.isActive });
      toast.success(room.isActive ? "Room deactivated" : "Room activated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function handleDelete(room: Room) {
    if (!confirm(`Delete room ${room.number}?`)) return;
    try {
      await deleteRoom(room.id);
      toast.success("Room deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light transition"
        >
          + Add Room
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
          <h3 className="font-semibold text-brand-deep">
            {editRoom ? `Edit Room ${editRoom.number}` : "New Room"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Room Number *</label>
              <input required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Floor</label>
              <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Type</label>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Deluxe" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light disabled:opacity-50 transition">
              {loading ? "Saving…" : editRoom ? "Update" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-neutral-border text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-neutral-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-border bg-neutral-section/50">
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Room No</th>
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Floor</th>
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Type</th>
              <th className="text-left px-5 py-3 font-medium text-neutral-muted">Status</th>
              <th className="text-right px-5 py-3 font-medium text-neutral-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-muted">No rooms yet</td></tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="border-b border-neutral-border last:border-0">
                  <td className="px-5 py-3 font-medium">{room.number}</td>
                  <td className="px-5 py-3 text-neutral-muted">{room.floor || "—"}</td>
                  <td className="px-5 py-3 text-neutral-muted">{room.type || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${room.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {room.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(room)} className="text-brand hover:text-brand-dark text-xs font-medium">Edit</button>
                    <button onClick={() => handleToggle(room)} className="text-neutral-muted hover:text-neutral-text text-xs font-medium">
                      {room.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(room)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
