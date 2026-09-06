import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  reverse?: boolean;
  durationSeconds?: number;
  className?: string;
}

export function Marquee({ children, reverse, durationSeconds = 40, className }: MarqueeProps) {
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
      >
        {children}
        {children}
      </div>
    </div>
  );
}
