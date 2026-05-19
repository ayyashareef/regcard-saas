interface OccupancyRingProps {
  occupied: number;
  available: number;
  cleaning: number;
  outOfOrder: number;
  total: number;
}

const LEGEND = [
  { key: "occupied", label: "Occupied", color: "var(--color-brand)" },
  { key: "available", label: "Available", color: "var(--color-status-green)" },
  { key: "cleaning", label: "Cleaning", color: "#7d6b3e" },
  { key: "outOfOrder", label: "Out of Order", color: "var(--color-status-red)" },
] as const;

export function OccupancyRing({ occupied, available, cleaning, outOfOrder, total }: OccupancyRingProps) {
  const counts: Record<(typeof LEGEND)[number]["key"], number> = {
    occupied,
    available,
    cleaning,
    outOfOrder,
  };

  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div
      style={{
        background: "var(--color-paper)",
        border: "1px solid var(--color-line)",
        borderRadius: 10,
        padding: 22,
      }}
    >
      <div
        className="flex justify-between items-center"
        style={{ paddingBottom: 14, borderBottom: "1px solid var(--color-line)", marginBottom: 18 }}
      >
        <h3
          className="font-serif"
          style={{ fontSize: 22, fontWeight: 600, color: "var(--color-ink)" }}
        >
          Occupancy
        </h3>
        <small
          className="font-mono uppercase"
          style={{ fontSize: 10, letterSpacing: ".2em", color: "var(--color-text-soft)", fontWeight: 500 }}
        >
          Live
        </small>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-[18px]">
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <svg
            width={120}
            height={120}
            viewBox="0 0 120 120"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={60}
              cy={60}
              r={radius}
              fill="none"
              stroke="var(--color-cream-2)"
              strokeWidth={10}
            />
            <circle
              cx={60}
              cy={60}
              r={radius}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={10}
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div
                className="font-serif"
                style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: "var(--color-ink)" }}
              >
                {pct}%
              </div>
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 9.5,
                  letterSpacing: ".18em",
                  color: "var(--color-text-soft)",
                  marginTop: 2,
                }}
              >
                Occupied
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-1">
          {LEGEND.map((row) => (
            <div
              key={row.key}
              className="flex justify-between items-center"
              style={{ fontSize: 12.5 }}
            >
              <span style={{ color: "var(--color-ink-2)" }}>
                <span
                  aria-hidden
                  className="inline-block align-middle"
                  style={{ width: 10, height: 10, borderRadius: 2, marginRight: 8, background: row.color }}
                />
                {row.label}
              </span>
              <b
                className="font-mono"
                style={{ fontWeight: 500, color: "var(--color-ink-2)" }}
              >
                {counts[row.key]}
              </b>
            </div>
          ))}
          <div
            className="flex justify-between items-center"
            style={{ fontSize: 12.5, paddingTop: 8, borderTop: "1px dashed var(--color-line)" }}
          >
            <span style={{ color: "var(--color-text-soft)" }}>Total rooms</span>
            <b className="font-mono" style={{ color: "var(--color-ink-2)" }}>
              {total}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}
