"use client";

import { useEffect, useRef, useState } from "react";
import type MatterJS from "matter-js";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Open" | "Planned" | "Done";

const CARDS: { title: string; votes: number; status: Status }[] = [
  { title: "Dark mode", votes: 128, status: "Done" },
  { title: "Offline sync", votes: 96, status: "Planned" },
  { title: "Export to CSV", votes: 74, status: "Planned" },
  { title: "Home screen widget", votes: 61, status: "Open" },
  { title: "Apple Watch app", votes: 52, status: "Open" },
  { title: "Team workspaces", votes: 47, status: "Open" },
  { title: "Keyboard shortcuts", votes: 39, status: "Done" },
  { title: "Calendar view", votes: 28, status: "Open" },
  { title: "iPad layout", votes: 34, status: "Planned" },
  { title: "Siri shortcuts", votes: 22, status: "Open" },
  { title: "Push reminders", votes: 18, status: "Open" },
];

/** Narrow boxes get fewer cards so the pile never fills them to the top. */
const NARROW = 480;
const NARROW_COUNT = 6;

const STATUS_STYLE: Record<Status, string> = {
  Open: "bg-muted text-muted-foreground",
  Planned: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

/** A drag beyond this many pixels is a throw, not a click on the vote button. */
const CLICK_SLOP = 6;

/**
 * A box of feature-request cards driven by a real 2D physics engine.
 * The cards are ordinary DOM elements (so they stay crisp, selectable by
 * screen readers and themeable); matter-js only decides where they are.
 */
export function PhysicsPit({ className }: { className?: string }) {
  const pitRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const movedRef = useRef(false);
  const bumpRef = useRef<(index: number) => void>(() => {});
  const [voted, setVoted] = useState<boolean[]>(() => CARDS.map(() => false));

  useEffect(() => {
    const pit = pitRef.current;
    if (!pit) return;
    let disposed = false;
    let stop = () => {};

    Promise.all([import("matter-js"), document.fonts?.ready]).then(([mod]) => {
      if (disposed) return;
      const Matter = ((mod as { default?: typeof MatterJS }).default ?? mod) as typeof MatterJS;
      const els = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
      stop = runPit(Matter, pit, els, movedRef, bumpRef);
    });

    return () => {
      disposed = true;
      stop();
    };
  }, []);

  const toggleVote = (index: number) => {
    // A throw that ended over the button should not count as a vote.
    if (movedRef.current) return;
    const next = !voted[index];
    setVoted((v) => v.map((x, i) => (i === index ? next : x)));
    if (next) bumpRef.current(index);
  };

  return (
    <div
      ref={pitRef}
      className={cn("lv2-cell-grid relative overflow-hidden", className)}
      data-testid="physics-pit"
    >
      {CARDS.map((card, i) => {
        const count = card.votes + (voted[i] ? 1 : 0);
        return (
          <div
            key={card.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="lv2-card flex items-center gap-3 rounded-xl bg-popover py-2 pr-3.5 pl-2 whitespace-nowrap text-popover-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_28px_-12px_rgba(0,0,0,0.28)] dark:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.85)]"
          >
            <button
              type="button"
              data-vote
              aria-pressed={voted[i]}
              aria-label={`${voted[i] ? "Remove vote for" : "Vote for"} ${card.title}, ${count} votes`}
              onClick={() => toggleVote(i)}
              className={cn(
                "flex w-10 flex-col items-center rounded-lg py-1 text-xs font-semibold tabular-nums transition-colors",
                voted[i]
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:text-primary",
              )}
            >
              <ChevronUp aria-hidden className="size-3.5" strokeWidth={2.5} />
              {count}
            </button>
            <span className="text-sm font-medium tracking-tight">{card.title}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLE[card.status])}>
              {card.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function runPit(
  Matter: typeof MatterJS,
  pit: HTMLDivElement,
  allEls: HTMLDivElement[],
  movedRef: React.RefObject<boolean>,
  bumpRef: React.RefObject<(index: number) => void>,
): () => void {
  const { Engine, Bodies, Body, Composite, Constraint, Sleeping, Vector } = Matter;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Seeded so the pile looks the same on every visit.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.scale = 0.0014;

  let W = pit.clientWidth;
  let H = pit.clientHeight;
  const els = W < NARROW ? allEls.slice(0, NARROW_COUNT) : allEls;
  const T = 400; // wall thickness: thick enough that a hard throw can't tunnel through

  const makeWalls = () => {
    const opts = { isStatic: true, friction: 0.6, restitution: 0.2 };
    const top = -2000;
    const span = H - top + T * 2;
    return [
      Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, opts),
      Bodies.rectangle(-T / 2, top + span / 2 - T, T, span, opts),
      Bodies.rectangle(W + T / 2, top + span / 2 - T, T, span, opts),
      Bodies.rectangle(W / 2, top - T / 2, W + T * 2, T, opts),
    ];
  };
  let walls = makeWalls();
  Composite.add(engine.world, walls);

  const sizes = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
  const bodies = els.map((_, i) => {
    const { w, h } = sizes[i];
    const x = clamp(rand() * W, w / 2 + 6, Math.max(w / 2 + 6, W - w / 2 - 6));
    // Stack them above the box so they arrive one after another.
    const y = -h - i * (h + 30) - 20;
    return Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: Math.min(12, h / 2 - 1) },
      angle: (rand() - 0.5) * 0.7,
      restitution: 0.32,
      friction: 0.35,
      frictionAir: 0.012,
      density: 0.0016,
      sleepThreshold: 40,
    });
  });

  const draw = () => {
    for (let i = 0; i < els.length; i++) {
      const b = bodies[i];
      const { w, h } = sizes[i];
      els[i].style.transform = `translate3d(${(b.position.x - w / 2).toFixed(2)}px, ${(b.position.y - h / 2).toFixed(2)}px, 0) rotate(${b.angle.toFixed(4)}rad)`;
    }
  };

  /** Keep every card inside the box, whatever happened. */
  const rescue = () => {
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const { w, h } = sizes[i];
      const speed = Vector.magnitude(b.velocity);
      if (speed > 38) Body.setVelocity(b, Vector.mult(b.velocity, 38 / speed));
      const out = b.position.x < -w || b.position.x > W + w || b.position.y > H + h;
      if (out || Number.isNaN(b.position.x)) {
        Body.setPosition(b, { x: W / 2, y: -h * 2 });
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
      }
    }
  };

  let dropped = false;
  const drop = () => {
    if (dropped) return;
    dropped = true;
    Composite.add(engine.world, bodies);
    if (reduceMotion) settle();
    draw();
    for (const el of els) el.style.visibility = "visible";
  };

  /** Run the simulation to rest without animating it. */
  const settle = () => {
    for (let n = 0; n < 900; n++) {
      Engine.update(engine, 1000 / 60);
      rescue();
      if (n > 60 && bodies.every((b) => b.isSleeping)) break;
    }
  };

  // Fixed time step: the same throw behaves the same on a 60 Hz or 120 Hz screen.
  const STEP = 1000 / 60;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;
  const tick = (t: number) => {
    acc += Math.min(last ? t - last : STEP, 100);
    last = t;
    while (acc >= STEP) {
      Engine.update(engine, STEP);
      rescue();
      acc -= STEP;
    }
    draw();
    raf = requestAnimationFrame(tick);
  };
  const play = () => {
    if (running || reduceMotion) return;
    running = true;
    last = 0;
    acc = 0;
    raf = requestAnimationFrame(tick);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Start the fall when the box scrolls into view; stop work when it leaves.
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        drop();
        play();
      } else {
        pause();
      }
    },
    { threshold: 0.2 },
  );
  io.observe(pit);

  // Dragging: a spring from the pointer to the exact point that was grabbed.
  // (Matter's own Mouse helper swallows wheel and touch scrolling, so it's not used.)
  let drag: { c: MatterJS.Constraint; el: HTMLElement; sx: number; sy: number; id: number } | null = null;
  const toLocal = (e: PointerEvent) => {
    const r = pit.getBoundingClientRect();
    return { x: clamp(e.clientX - r.left, 0, W), y: clamp(e.clientY - r.top, -300, H) };
  };

  const onDown = (e: PointerEvent) => {
    if (reduceMotion || drag || (e.pointerType === "mouse" && e.button !== 0)) return;
    const el = e.currentTarget as HTMLElement;
    const i = els.indexOf(el as HTMLDivElement);
    if (i < 0) return;
    const b = bodies[i];
    const p = toLocal(e);
    Sleeping.set(b, false);
    const c = Constraint.create({
      pointA: p,
      bodyB: b,
      pointB: Vector.rotate(Vector.sub(p, b.position), -b.angle),
      stiffness: 0.16,
      damping: 0.08,
      length: 0,
    });
    Composite.add(engine.world, c);
    drag = { c, el, sx: e.clientX, sy: e.clientY, id: e.pointerId };
    movedRef.current = false;
    el.dataset.dragging = "true";
    play();
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.c.pointA = toLocal(e);
    if (drag.c.bodyB) Sleeping.set(drag.c.bodyB, false);
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > CLICK_SLOP) movedRef.current = true;
    if (movedRef.current) e.preventDefault();
  };
  const onUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    Composite.remove(engine.world, drag.c);
    delete drag.el.dataset.dragging;
    drag = null;
    // Let the click handler read movedRef first, then reset it.
    setTimeout(() => {
      movedRef.current = false;
    }, 0);
  };

  for (const el of els) el.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  bumpRef.current = (i: number) => {
    if (reduceMotion || !dropped) return;
    const b = bodies[i];
    Sleeping.set(b, false);
    Body.setVelocity(b, { x: (rand() - 0.5) * 5, y: -11 });
    Body.setAngularVelocity(b, (rand() - 0.5) * 0.25);
    play();
  };

  const ro = new ResizeObserver(() => {
    const nW = pit.clientWidth;
    const nH = pit.clientHeight;
    if (nW === W && nH === H) return;
    W = nW;
    H = nH;
    Composite.remove(engine.world, walls);
    walls = makeWalls();
    Composite.add(engine.world, walls);
    bodies.forEach((b, i) => {
      const { w, h } = sizes[i];
      Body.setPosition(b, {
        x: clamp(b.position.x, w / 2 + 2, Math.max(w / 2 + 2, W - w / 2 - 2)),
        y: Math.min(b.position.y, H - h / 2 - 2),
      });
      Sleeping.set(b, false);
    });
    if (reduceMotion && dropped) {
      settle();
      draw();
    }
  });
  ro.observe(pit);

  return () => {
    pause();
    io.disconnect();
    ro.disconnect();
    for (const el of els) el.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    bumpRef.current = () => {};
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  };
}
