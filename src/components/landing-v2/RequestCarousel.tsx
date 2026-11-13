"use client";

import { useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";

type Status = "open" | "planned" | "in_progress" | "done";

const STATUS: Record<Status, { label: string; dot: string }> = {
  open: { label: "Pending", dot: "bg-zinc-400" },
  planned: { label: "Planned", dot: "bg-blue-400" },
  in_progress: { label: "In progress", dot: "bg-amber-400" },
  done: { label: "Done", dot: "bg-emerald-400" },
};

// Example boards. Made-up apps, to show what a top request looks like.
const CARDS: { app: string; platform: string; title: string; votes: number; status: Status; hue: number }[] = [
  { app: "Habit tracker", platform: "SwiftUI", title: "Home screen widget", votes: 412, status: "planned", hue: 42 },
  { app: "Recipe app", platform: "Flutter", title: "Shopping list sync", votes: 287, status: "in_progress", hue: 200 },
  { app: "Budget app", platform: "Kotlin", title: "Dark mode", votes: 931, status: "done", hue: 300 },
  { app: "Fitness app", platform: "React", title: "Apple Health import", votes: 356, status: "open", hue: 150 },
  { app: "Notes app", platform: "Next.js", title: "Offline mode", votes: 198, status: "planned", hue: 260 },
  { app: "Booking app", platform: "Laravel", title: "Google Calendar sync", votes: 264, status: "in_progress", hue: 20 },
  { app: "Journal app", platform: "SwiftUI", title: "Face ID lock", votes: 521, status: "done", hue: 330 },
  { app: "Podcast app", platform: "Kotlin", title: "Sleep timer", votes: 175, status: "planned", hue: 230 },
  { app: "Study app", platform: "Flutter", title: "Shared flashcard decks", votes: 309, status: "open", hue: 90 },
  { app: "Travel app", platform: "React", title: "Offline maps", votes: 448, status: "in_progress", hue: 180 },
];

const CARD_W = 220;
const GAP = 22;
const SPACING = CARD_W + GAP;
const RADIUS = 1500; // radius of the curve the cards sit on
const SPEED = 28; // px per second

/** Example requests sliding along a concave curve, like a wall of screens. */
export function RequestCarousel() {
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = CARDS.length * SPACING;
    let offset = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const place = () => {
      const half = el.clientWidth / 2 + CARD_W;
      cards.current.forEach((card, i) => {
        if (!card) return;
        let x = (((i * SPACING - offset) % total) + total) % total;
        if (x > total / 2) x -= total;
        if (Math.abs(x) > half + SPACING) {
          card.style.visibility = "hidden";
          return;
        }
        const a = x / RADIUS;
        const tx = RADIUS * Math.sin(a);
        const tz = RADIUS * (1 - Math.cos(a));
        card.style.visibility = "visible";
        card.style.transform = `translate3d(${tx - CARD_W / 2}px,0,${tz}px) rotateY(${-a}rad)`;
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      if (visible && !reduce) offset += SPEED * dt;
      place();
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    place();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="v2-carousel relative h-[360px] overflow-hidden sm:h-[400px]"
      style={{ perspective: "1100px", perspectiveOrigin: "50% 40%" }}
      aria-label="Example feature requests from apps using Fewchurs"
      role="img"
    >
      <div className="absolute top-6 left-1/2 h-full" style={{ transformStyle: "preserve-3d" }}>
        {CARDS.map((c, i) => (
          <div
            key={c.title}
            ref={(n) => {
              cards.current[i] = n;
            }}
            className="absolute top-0 left-0 will-change-transform"
            style={{ width: CARD_W, visibility: "hidden" }}
          >
            <RequestCard {...c} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--v2-bg)] to-transparent" />
    </div>
  );
}

function RequestCard({ app, platform, title, votes, status, hue }: (typeof CARDS)[number]) {
  const s = STATUS[status];
  const bars = [0.35, 0.5, 0.42, 0.62, 0.7, 0.85, 1];
  return (
    <div
      className="relative flex h-[300px] flex-col overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl shadow-black/60"
      style={{
        background: `radial-gradient(120% 80% at 80% 0%, oklch(0.42 0.12 ${hue} / 0.55), transparent 60%), linear-gradient(180deg, oklch(0.24 0.02 ${hue}), oklch(0.17 0.01 ${hue}))`,
      }}
    >
      <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">{app}</p>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-[#ff5a14] text-white shadow-lg shadow-[#ff5a14]/30">
          <ChevronUp className="size-6" strokeWidth={3} />
        </span>
        <span className="text-4xl font-extrabold tracking-[-0.04em] text-white tabular-nums">{votes}</span>
      </div>
      <p className="mt-4 text-xl leading-tight font-bold tracking-[-0.02em] text-balance text-white">{title}</p>
      <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-medium text-white/85">
        <span className={`size-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
      <div className="mt-auto flex h-10 items-end gap-1.5" aria-hidden>
        {bars.map((b, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${b * 100}%`, background: `oklch(0.75 0.12 ${hue} / ${0.25 + b * 0.5})` }}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/60%)]">
        {platform}
      </p>
    </div>
  );
}
