"use client";

import { useState } from "react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  entityLabel: string | null;
  performedById: string;
  performedBy: { name: string; email: string };
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  REG_CARD_CREATED: "Card Created",
  REG_CARD_UPDATED: "Card Updated",
  REG_CARD_DELETED: "Card Deleted",
  REG_CARD_PDF_DOWNLOADED: "PDF Downloaded",
  USER_CREATED: "User Created",
  USER_UPDATED: "User Updated",
  USER_DEACTIVATED: "User Deactivated",
  USER_LOGIN: "Login",
  USER_LOGOUT: "Logout",
  ROOM_CREATED: "Room Created",
  ROOM_UPDATED: "Room Updated",
  ROOM_DELETED: "Room Deleted",
  EXTENSION_REQUESTED: "Extension Requested",
  EXTENSION_APPROVED: "Extension Approved",
  EXTENSION_REJECTED: "Extension Rejected",
};

const actionColors: Record<string, string> = {
  REG_CARD_CREATED: "bg-green-100 text-green-800",
  REG_CARD_UPDATED: "bg-blue-100 text-blue-800",
  REG_CARD_DELETED: "bg-red-100 text-red-800",
  USER_DEACTIVATED: "bg-red-100 text-red-800",
  EXTENSION_APPROVED: "bg-green-100 text-green-800",
  EXTENSION_REJECTED: "bg-red-100 text-red-800",
};

export function AuditLogViewer({ logs }: { logs: AuditLog[] }) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? logs.filter(
        (l) =>
          l.action.includes(filter) ||
          l.entity.includes(filter) ||
          l.performedBy.name.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by action, entity, or user..."
        className="w-full max-w-md px-4 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
      />

      <div className="bg-white rounded-xl border border-neutral-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-border bg-neutral-section/50">
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Time</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Action</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Entity</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Label</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Performed By</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-neutral-muted">No logs found</td></tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-border last:border-0">
                    <td className="px-5 py-3 text-neutral-muted text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${actionColors[log.action] || "bg-neutral-section text-neutral-muted"}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-muted text-xs">{log.entity}</td>
                    <td className="px-5 py-3 font-mono text-xs">{log.entityLabel || log.entityId}</td>
                    <td className="px-5 py-3 text-neutral-muted">{log.performedBy.name}</td>
                    <td className="px-5 py-3 text-xs text-neutral-muted">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
