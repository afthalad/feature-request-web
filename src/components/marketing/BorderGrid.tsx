import { cn } from "@/lib/utils";

interface BorderGridProps {
  children: React.ReactNode;
  cols?: 2 | 3;
  className?: string;
}

export function BorderGrid({ children, cols = 2, className }: BorderGridProps) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-xl border border-border bg-border",
        cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BorderGridCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("bg-card p-7 sm:p-8", className)}>{children}</div>;
}
