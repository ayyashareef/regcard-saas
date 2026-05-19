interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Right-aligned action buttons / controls. */
  actions?: React.ReactNode;
}

/**
 * The design's `.page-head` block — a monospace eyebrow, a serif title, an
 * optional subtitle, and an optional cluster of actions on the right.
 * Stacks (actions below) on mobile.
 */
export function PageHeaderV2({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8 lg:mb-12">
      <div className="min-w-0">
        <small
          className="block font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: ".24em",
            color: "var(--color-brand-deep)",
            marginBottom: 14,
            fontWeight: 500,
          }}
        >
          {eyebrow}
        </small>
        <h1
          className="font-serif"
          style={{
            fontWeight: 600,
            fontSize: "clamp(26px, 5.5vw, 44px)",
            lineHeight: 1.05,
            color: "var(--color-ink)",
            letterSpacing: "-.005em",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-3.5 max-w-[540px] leading-relaxed"
            style={{ color: "var(--color-text-soft)", fontSize: 14 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

const baseBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 6,
  border: "1px solid var(--color-line-2)",
  background: "#fff",
  color: "var(--color-ink-2)",
  fontSize: 13,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/** Plain action button used in page headers. */
export function HeaderButton({
  children,
  variant = "default",
  href,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "gold";
  href?: string;
}) {
  const style: React.CSSProperties = { ...baseBtn };
  if (variant === "primary") {
    style.background = "var(--color-ink-2)";
    style.color = "#f5ecd2";
    style.borderColor = "var(--color-ink-2)";
  } else if (variant === "gold") {
    style.background = "linear-gradient(180deg,#c69a4a,#a07424)";
    style.color = "#fff";
    style.borderColor = "#8a6420";
  }
  if (href) {
    return (
      <a href={href} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" style={style}>
      {children}
    </button>
  );
}
