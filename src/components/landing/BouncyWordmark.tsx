"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const WORD = "fewchurs";

type Letter = {
  y: number; // px, 0 = resting on the baseline, negative = in the air
  vy: number;
  rot: number; // rad
  vr: number;
  squash: number; // 0 = normal, + = flattened
  vs: number;
  delay: number; // s before this letter starts falling
};

const GRAVITY = 5200; // px/s²
const BOUNCE = 0.38; // share of speed kept after hitting the floor

/**
 * The giant footer wordmark. Each letter is its own little physics body:
 * it falls under gravity, bounces on the baseline, squashes on impact and
 * springs back upright. Hover (or tap) a letter to throw it up again.
 */
export function BouncyWordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = letterRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    const state: Letter[] = els.map((_, i) => ({ y: 0, vy: 0, rot: 0, vr: 0, squash: 0, vs: 0, delay: 0 + i * 0.07 }));
    let height = root.offsetHeight || 200;

    const paint = () => {
      els.forEach((el, i) => {
        const s = state[i];
        const sx = 1 + s.squash * 0.5;
        const sy = 1 - s.squash;
        el.style.transform = `translate3d(0, ${s.y.toFixed(2)}px, 0) rotate(${s.rot.toFixed(4)}rad) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      });
    };

    // Park every letter above the frame until the footer comes into view.
    state.forEach((s) => (s.y = -height * 1.4));
    const landed = state.map(() => false);
    els.forEach((el) => (el.style.opacity = "0"));
    paint();

    let raf = 0;
    let last = 0;
    let running = false;
    let started = false;
    let clock = 0;

    const step = (dt: number) => {
      let busy = false;
      clock += dt;
      state.forEach((s, i) => {
        if (clock < s.delay) {
          busy = true;
          return;
        }
        const airborne = s.y < 0 || s.vy !== 0;
        if (airborne) {
          s.vy += GRAVITY * dt;
          s.y += s.vy * dt;
          if (s.y >= 0) {
            const impact = s.vy;
            s.y = 0;
            s.vy = impact > 140 ? -impact * BOUNCE : 0;
            // Squash in proportion to how hard it landed.
            s.vs += Math.min(impact / 260, 9);
          }
        }
        // Fade in on the way down the first time, so letters don't streak over the links above.
        if (!landed[i]) {
          if (s.y === 0) landed[i] = true;
          els[i].style.opacity = landed[i] ? "1" : String(Math.max(0, Math.min(1, 1 + s.y / height)));
        }
        // Rotation and squash are damped springs back to rest.
        s.vr += (-170 * s.rot - 11 * s.vr) * dt;
        s.rot += s.vr * dt;
        s.vs += (-520 * s.squash - 20 * s.vs) * dt;
        s.squash += s.vs * dt;
        const still =
          s.y === 0 && s.vy === 0 && Math.abs(s.rot) < 0.001 && Math.abs(s.vr) < 0.01 &&
          Math.abs(s.squash) < 0.001 && Math.abs(s.vs) < 0.01;
        if (still) {
          s.rot = s.vr = s.squash = s.vs = 0;
        } else {
          busy = true;
        }
      });
      return busy;
    };

    const tick = (t: number) => {
      const dt = Math.min(last ? (t - last) / 1000 : 1 / 60, 1 / 30);
      last = t;
      // Two half steps keep the bounce stable on slow frames.
      const a = step(dt / 2);
      const b = step(dt / 2);
      const busy = a || b;
      paint();
      if (busy) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };
    const wake = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          height = root.offsetHeight || height;
          wake();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);

    const kick = (i: number) => {
      if (!started) return;
      const s = state[i];
      if (s.y < -height * 0.15) return; // already flying
      s.delay = 0;
      s.vy = -(900 + Math.random() * 500);
      s.vr += (Math.random() - 0.5) * 24;
      wake();
    };
    const handlers = els.map((el, i) => {
      const h = () => kick(i);
      el.addEventListener("pointerenter", h);
      el.addEventListener("pointerdown", h);
      return h;
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      els.forEach((el, i) => {
        el.removeEventListener("pointerenter", handlers[i]);
        el.removeEventListener("pointerdown", handlers[i]);
        el.style.transform = "";
        el.style.opacity = "";
      });
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-label="Fewchurs"
      role="img"
      className={cn(
        "flex select-none justify-center text-[clamp(4.5rem,18.5vw,15rem)] leading-[0.78] font-extrabold tracking-[-0.065em] text-primary",
        className,
      )}
    >
      {WORD.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className="lv2-letter cursor-default pr-[0.02em]"
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
