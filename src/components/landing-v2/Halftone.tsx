"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Orange halftone dots that fade in from the edges. "corners" lights the two
 * top corners and the sides (the hero); "right" lights the right edge (the CTA card).
 */
export function Halftone({ mode = "corners", className }: { mode?: "corners" | "right"; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const gap = w < 640 ? 8 : 10;
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          let t: number;
          if (mode === "corners") {
            const side = Math.abs(x - w / 2) / (w / 2); // 0 centre, 1 edge
            const down = y / h; // 0 top, 1 bottom
            const start = w < 640 ? 0.7 : 0.42; // keep phone-width text clear of the dots
            t = smooth(start, 1, side) * (1 - down * 0.95) + smooth(0.8, 1, side) * 0.15;
          } else {
            t = smooth(0.35, 1, x / w) * (0.55 + 0.45 * Math.sin((y / h) * Math.PI));
          }
          // A little noise so it reads as halftone, not a gradient.
          if (t < 0.04) continue;
          t *= 0.6 + hash(x, y) * 0.7;
          if (t < 0.1) continue;
          t = Math.min(t, 1);
          ctx.globalAlpha = (0.2 + t * 0.8) * 0.55; // kept dim so the dots sit behind the content
          ctx.fillStyle = "#ff5a14";
          const r = 0.5 + t * (gap * 0.22);
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [mode]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)} />;
}

function smooth(a: number, b: number, v: number) {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
