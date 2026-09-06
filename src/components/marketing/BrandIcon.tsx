import type { SVGProps } from "react";

interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill" | "color"> {
  path: string;
  color?: string;
}

export function BrandIcon({ path, color, className, ...props }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={color ?? "currentColor"} className={className} {...props}>
      <path d={path} />
    </svg>
  );
}
