interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Right-aligned action buttons / controls. */
  actions?: React.ReactNode;
}

/**
 * Dense console page header (`.ph`): monospace eyebrow, tight serif title,
 * optional subtitle, and a right-aligned action cluster.
 */
export function PageHeaderV2({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="ph">
      <div className="ph-l">
        <div className="ph-eyebrow">{eyebrow}</div>
        <h1 className="ph-h">{title}</h1>
        {subtitle && (
          <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "2px 0 0", maxWidth: 560 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

/** Page-header action button mapped onto the design's `.btn` system. */
export function HeaderButton({
  children,
  variant = "default",
  href,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "gold";
  href?: string;
}) {
  // "gold" was the old accent CTA — now just the primary accent button.
  const cls = `btn sm ${variant === "primary" || variant === "gold" ? "primary" : "ghost"}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls}>
      {children}
    </button>
  );
}
