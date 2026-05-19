import Link from "next/link";
import type { RegCard, Room } from "@prisma/client";
import { getArrivalBadge } from "@/lib/stay-status";

type ArrivalRow = RegCard & { room: Room | null };

interface ArrivalsTableProps {
  arrivals: ArrivalRow[];
  expected?: number;
}

function initials(name: string | null) {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function arrivalStatus(card: ArrivalRow): "in" | "pending" | "out" {
  // Single source of truth — see lib/stay-status.ts. The dashboard KPIs and
  // rooms board use the same predicate, so a card cannot show "Checked out"
  // here while still being counted as Occupied on the KPI.
  return getArrivalBadge(card);
}

const statusLabel = {
  in: "Checked in",
  pending: "Awaiting",
  out: "Checked out",
} as const;

const statusStyles = {
  in: { background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" },
  pending: { background: "rgba(184,137,59,.14)", color: "var(--color-brand-deep)" },
  out: { background: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" },
} as const;

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date());
}

export function ArrivalsTable({ arrivals, expected }: ArrivalsTableProps) {
  return (
    <div
      style={{
        background: "var(--color-paper)",
        border: "1px solid var(--color-line)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        className="flex justify-between items-center"
        style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <div className="flex items-baseline gap-2.5">
          <h3
            className="font-serif"
            style={{ fontSize: 22, fontWeight: 600, color: "var(--color-ink)" }}
          >
            Today&apos;s Arrivals
          </h3>
          <small
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: ".2em",
              color: "var(--color-text-soft)",
              fontWeight: 500,
            }}
          >
            {todayLabel()} {expected !== undefined ? `· ${expected} expected` : ""}
          </small>
        </div>
      </div>

      {arrivals.length === 0 ? (
        <div
          className="text-center"
          style={{ padding: "48px 22px", color: "var(--color-text-soft)", fontSize: 13 }}
        >
          No arrivals today.
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Card No", "Guest", "Room", "Arrival", "Status"].map((h) => (
                <th
                  key={h}
                  className="font-mono uppercase text-left"
                  style={{
                    padding: "12px 22px",
                    fontSize: 10.5,
                    letterSpacing: ".16em",
                    color: "var(--color-text-soft)",
                    background: "rgba(184,137,59,.05)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--color-line)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {arrivals.map((card) => {
              const status = arrivalStatus(card);
              return (
                <tr key={card.id}>
                  <td
                    className="font-mono"
                    style={{
                      padding: "14px 22px",
                      borderBottom: "1px solid var(--color-line)",
                      fontSize: 12,
                      color: "var(--color-ink-2)",
                      fontWeight: 500,
                    }}
                  >
                    <Link href={`/reg-cards/${card.id}`} className="hover:underline">
                      {card.cardNo}
                    </Link>
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: "1px solid var(--color-line)" }}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="grid place-items-center"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "var(--color-ink-2)",
                          color: "#f5ecd2",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {initials(card.guestName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: 13 }}>
                          {card.guestName || "—"}
                        </div>
                        {card.idNumber && (
                          <div
                            className="font-mono"
                            style={{ fontSize: 10.5, color: "var(--color-text-soft)", letterSpacing: ".04em" }}
                          >
                            {card.idType} · {card.idNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: "1px solid var(--color-line)" }}>
                    <span
                      className="font-mono"
                      style={{ fontSize: 12.5, color: "var(--color-ink-2)", fontWeight: 600 }}
                    >
                      {card.room?.number || "—"}
                    </span>
                    {card.room?.type && (
                      <span
                        className="uppercase"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 500,
                          color: "var(--color-text-soft)",
                          letterSpacing: ".06em",
                          marginLeft: 8,
                        }}
                      >
                        · {card.room.type}
                      </span>
                    )}
                  </td>
                  <td
                    className="font-mono"
                    style={{
                      padding: "14px 22px",
                      borderBottom: "1px solid var(--color-line)",
                      fontSize: 12.5,
                      color: "var(--color-ink-2)",
                    }}
                  >
                    {card.checkInTime || "—"}
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: "1px solid var(--color-line)" }}>
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        padding: "3px 9px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: ".04em",
                        ...statusStyles[status],
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "currentColor",
                          display: "inline-block",
                        }}
                      />
                      {statusLabel[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
