interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ points, width = 200, height = 28 }: SparklineProps) {
  if (points.length < 2) {
    return <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden />;
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePoints = coords.join(" ");
  const fillPoints = `0,${height} ${linePoints} ${width},${height}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline points={fillPoints} fill="rgba(184,137,59,.12)" stroke="none" />
      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
