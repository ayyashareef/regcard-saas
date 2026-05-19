import { Sparkline } from "@/components/v2/dashboard/sparkline";

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    dir: "up" | "down" | "flat";
    text: string;
  };
  footer?: React.ReactNode;
  sparkline?: number[];
  progressPercent?: number;
}

const trendStyles = {
  up: { background: "rgba(63,122,74,.12)", color: "var(--color-status-green)" },
  down: { background: "rgba(164,74,58,.12)", color: "var(--color-status-red)" },
  flat: { background: "rgba(107,114,128,.12)", color: "var(--color-text-soft)" },
} as const;

export function KpiCard({ label, value, unit, trend, footer, sparkline, progressPercent }: KpiCardProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--color-paper)",
        border: "1px solid var(--color-line)",
        borderRadius: 10,
        padding: "20px 22px",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "var(--color-brand)",
        }}
      />
      <div
        className="font-mono uppercase flex items-center justify-between gap-3"
        style={{
          fontSize: 10,
          letterSpacing: ".2em",
          color: "var(--color-text-soft)",
          marginBottom: 14,
        }}
      >
        <span>{label}</span>
        {trend && (
          <span
            className="font-semibold"
            style={{
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 10,
              letterSpacing: ".08em",
              ...trendStyles[trend.dir],
            }}
          >
            {trend.text}
          </span>
        )}
      </div>
      <div
        className="font-serif"
        style={{
          fontSize: 34,
          fontWeight: 600,
          color: "var(--color-ink)",
          lineHeight: 1,
          letterSpacing: "-.01em",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-soft)", fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>
      {sparkline && (
        <div style={{ marginTop: 14 }}>
          <Sparkline points={sparkline} />
        </div>
      )}
      {progressPercent !== undefined && (
        <div
          style={{
            height: 8,
            background: "var(--color-cream-2)",
            borderRadius: 4,
            overflow: "hidden",
            marginTop: 14,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              background: "linear-gradient(90deg,#c69a4a,#a07424)",
              borderRadius: 4,
            }}
          />
        </div>
      )}
      {footer && (
        <div
          className="flex justify-between items-center"
          style={{ marginTop: 14, fontSize: 11.5, color: "var(--color-text-soft)", gap: 10 }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
