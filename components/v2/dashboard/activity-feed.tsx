import type { AuditLog } from "@prisma/client";
import type { AuditAction } from "@/lib/enums";

type ActivityRow = AuditLog & {
  performedBy: { name: string; email: string } | null;
};

interface ActivityFeedProps {
  entries: ActivityRow[];
}

interface TagInfo {
  label: string;
  style: { background: string; color: string };
}

const TAG_BY_ACTION: Partial<Record<AuditAction, TagInfo>> = {
  REG_CARD_CREATED: { label: "Check-in", style: { background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" } },
  REG_CARD_UPDATED: { label: "Update", style: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" } },
  REG_CARD_DELETED: { label: "Delete", style: { background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" } },
  REG_CARD_PDF_DOWNLOADED: { label: "PDF", style: { background: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" } },
  EXTENSION_REQUESTED: { label: "Ext req", style: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" } },
  EXTENSION_APPROVED: { label: "Approved", style: { background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" } },
  EXTENSION_REJECTED: { label: "Rejected", style: { background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" } },
  USER_LOGIN: { label: "Login", style: { background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" } },
  USER_LOGOUT: { label: "Logout", style: { background: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" } },
  USER_CREATED: { label: "User", style: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" } },
  USER_UPDATED: { label: "User", style: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" } },
  USER_DEACTIVATED: { label: "Deact", style: { background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" } },
  ROOM_CREATED: { label: "Room", style: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" } },
  ROOM_UPDATED: { label: "Room", style: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" } },
  ROOM_DELETED: { label: "Room", style: { background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" } },
};

function tagFor(action: AuditAction): TagInfo {
  return (
    TAG_BY_ACTION[action] ?? {
      label: "Event",
      style: { background: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" },
    }
  );
}

function describe(entry: ActivityRow): string {
  const who = entry.performedBy?.name ?? "Someone";
  const target = entry.entityLabel ?? entry.entityId;
  switch (entry.action) {
    case "REG_CARD_CREATED":
      return `${who} created reg card ${target}`;
    case "REG_CARD_UPDATED":
      return `${who} updated reg card ${target}`;
    case "REG_CARD_DELETED":
      return `${who} deleted reg card ${target}`;
    case "REG_CARD_PDF_DOWNLOADED":
      return `${who} downloaded PDF for ${target}`;
    case "EXTENSION_REQUESTED":
      return `${who} requested an extension on ${target}`;
    case "EXTENSION_APPROVED":
      return `${who} approved an extension on ${target}`;
    case "EXTENSION_REJECTED":
      return `${who} rejected an extension on ${target}`;
    case "USER_LOGIN":
      return `${who} logged in`;
    case "USER_LOGOUT":
      return `${who} logged out`;
    case "USER_CREATED":
      return `${who} created user ${target}`;
    case "USER_UPDATED":
      return `${who} updated user ${target}`;
    case "USER_DEACTIVATED":
      return `${who} deactivated user ${target}`;
    case "ROOM_CREATED":
      return `${who} added room ${target}`;
    case "ROOM_UPDATED":
      return `${who} updated room ${target}`;
    case "ROOM_DELETED":
      return `${who} removed room ${target}`;
    default:
      return `${who} · ${entry.action}`;
  }
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <div
      style={{
        background: "var(--color-paper)",
        border: "1px solid var(--color-line)",
        borderRadius: 10,
        padding: "18px 22px",
      }}
    >
      <div
        className="flex justify-between items-center"
        style={{ paddingBottom: 14, borderBottom: "1px solid var(--color-line)", marginBottom: 6 }}
      >
        <h3
          className="font-serif"
          style={{ fontSize: 22, fontWeight: 600, color: "var(--color-ink)" }}
        >
          Activity
        </h3>
        <small
          className="font-mono uppercase"
          style={{ fontSize: 10, letterSpacing: ".2em", color: "var(--color-text-soft)", fontWeight: 500 }}
        >
          Last {entries.length}
        </small>
      </div>

      {entries.length === 0 ? (
        <div
          className="text-center"
          style={{ padding: "32px 0", color: "var(--color-text-soft)", fontSize: 13 }}
        >
          No recent activity.
        </div>
      ) : (
        entries.map((entry, idx) => {
          const tag = tagFor(entry.action as AuditAction);
          const isLast = idx === entries.length - 1;
          return (
            <div
              key={entry.id}
              className="flex gap-3.5"
              style={{
                padding: "12px 0",
                borderBottom: isLast ? "none" : "1px dashed var(--color-line)",
              }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-text-soft)",
                  letterSpacing: ".06em",
                  width: 54,
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                {formatTime(entry.createdAt)}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>{describe(entry)}</span>
                <span
                  className="font-mono uppercase inline-block"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: ".14em",
                    padding: "1px 7px",
                    borderRadius: 3,
                    marginLeft: 6,
                    fontWeight: 600,
                    ...tag.style,
                  }}
                >
                  {tag.label}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
