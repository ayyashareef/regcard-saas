import Link from "next/link";
import type { RegCard, Room } from "@prisma/client";

type RecentRow = RegCard & { room: Room | null };

interface RecentCardsTableProps {
  cards: RecentRow[];
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function RecentCardsTable({ cards }: RecentCardsTableProps) {
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
            Recent Cards
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
            Last {cards.length}
          </small>
        </div>
        <Link
          href="/reg-cards"          className="font-mono uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: ".14em",
            color: "var(--color-brand-deep)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View all →
        </Link>
      </div>

      {cards.length === 0 ? (
        <div
          className="text-center"
          style={{ padding: "48px 22px", color: "var(--color-text-soft)", fontSize: 13 }}
        >
          No registration cards yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Card No", "Guest", "Room", "Created"].map((h) => (
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
            {cards.map((card) => (
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
                <td
                  style={{
                    padding: "14px 22px",
                    borderBottom: "1px solid var(--color-line)",
                    fontWeight: 600,
                    color: "var(--color-ink)",
                  }}
                >
                  {card.guestName || "—"}
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
                  {card.room?.number || "—"}
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
                  {formatDate(card.createdAt)}
                  <small
                    style={{
                      display: "block",
                      fontSize: 10.5,
                      color: "var(--color-text-soft)",
                      marginTop: 2,
                      letterSpacing: ".04em",
                    }}
                  >
                    {formatTime(card.createdAt)}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
