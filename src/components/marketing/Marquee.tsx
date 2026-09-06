import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  reverse?: boolean;
  durationSeconds?: number;
  /** How many times to repeat the content. Raise this for short content rows so the
   *  loop has no empty gap on wide screens (default 2 is fine for long/wide content). */
  repeat?: number;
  className?: string;
}

export function Marquee({
  children,
  reverse,
  durationSeconds = 40,
  repeat = 2,
  className,
}: MarqueeProps) {
  return (
    <div
      className={cn("mask-fade-x overflow-hidden", className)}
      style={{ "--scroll-duration": `${durationSeconds}s` } as React.CSSProperties}
    >
      <div
        className={cn(
          "flex w-max gap-4",
          reverse ? "animate-scroll-horizontal-reverse" : "animate-scroll-horizontal"
        )}
        style={{ "--scroll-distance": `${-100 / repeat}%` } as React.CSSProperties}
      >
        {Array.from({ length: repeat }, (_, i) => (
          <div key={i} className="flex shrink-0 gap-4">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
