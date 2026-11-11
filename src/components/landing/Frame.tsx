import { cn } from "@/lib/utils";

/**
 * The page sits inside one centred column with dashed side rails.
 * Every section adds a solid top rule with small orange squares where
 * the rule meets the rails, like a technical drawing.
 */
export function FrameSection({
  children,
  className,
  innerClassName,
  id,
  corners = true,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  id?: string;
  corners?: boolean;
  "aria-label"?: string;
}) {
  return (
    <section id={id} aria-label={ariaLabel} className={cn("relative px-4 sm:px-6", className)}>
      <div className="lv2-rails relative mx-auto w-full max-w-[1200px] border-t border-border">
        {corners && (
          <>
            <span aria-hidden className="lv2-corner -left-[4px] -top-[4px]" />
            <span aria-hidden className="lv2-corner -right-[4px] -top-[4px]" />
          </>
        )}
        <div className={innerClassName}>{children}</div>
      </div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase",
        className,
      )}
    >
      <span className="text-primary">[</span> {children} <span className="text-primary">]</span>
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="max-w-3xl text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
        {title}
      </h2>
      {body && <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{body}</p>}
    </div>
  );
}
