"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronUp, Mail, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                       */
/* ------------------------------------------------------------------ */

function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

function BentoCell({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col border-border", className)}>
      <div className="lv2-cell-grid relative flex h-[280px] items-center justify-center overflow-hidden border-b border-border px-6">
        {children}
      </div>
      <div className="space-y-2 p-6 sm:p-8">
        <h3 className="text-xl font-semibold tracking-[-0.03em]">{title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{body}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Votes re-rank the list (FLIP with a springy overshoot)            */
/* ------------------------------------------------------------------ */

const RANK_START = [
  { id: "csv", title: "Export to CSV", votes: 74 },
  { id: "widget", title: "Home screen widget", votes: 66 },
  { id: "watch", title: "Apple Watch app", votes: 58 },
  { id: "teams", title: "Team workspaces", votes: 51 },
];

function RankingDemo() {
  const [items, setItems] = useState(RANK_START);
  const [mine, setMine] = useState<string | null>(null);
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduce = useReducedMotion();
  const rows = useRef(new Map<string, HTMLLIElement>());
  const prevTops = useRef(new Map<string, number>());

  const vote = (id: string, by: number) =>
    setItems((list) =>
      [...list.map((it) => (it.id === id ? { ...it, votes: it.votes + by } : it))].sort((a, b) => b.votes - a.votes),
    );

  // Someone, somewhere, votes every couple of seconds while this is on screen.
  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => {
      setItems((list) => {
        const pick = list[1 + Math.floor(Math.random() * (list.length - 1))];
        const gap = list[0].votes - pick.votes;
        const by = Math.max(3, Math.ceil(gap * (0.4 + Math.random() * 0.7)));
        return [...list.map((it) => (it.id === pick.id ? { ...it, votes: it.votes + by } : it))].sort(
          (a, b) => b.votes - a.votes,
        );
      });
    }, 2200);
    return () => clearInterval(t);
  }, [inView, reduce]);

  // FLIP: measure where each row was, let React move it, then animate from old to new.
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    rows.current.forEach((el, id) => next.set(id, el.offsetTop));
    if (!reduce) {
      next.forEach((top, id) => {
        const before = prevTops.current.get(id);
        const el = rows.current.get(id);
        if (before === undefined || !el || before === top) return;
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], {
          duration: 650,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        });
      });
    }
    prevTops.current = next;
  }, [items, reduce]);

  return (
    <div ref={ref} className="w-full max-w-[340px]">
      <ul className="relative space-y-2">
        {items.map((it, i) => (
          <li
            key={it.id}
            ref={(el) => {
              if (el) rows.current.set(it.id, el);
              else rows.current.delete(it.id);
            }}
            className="flex items-center gap-3 rounded-xl bg-popover px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-14px_rgba(0,0,0,0.22)] dark:shadow-none"
          >
            <button
              type="button"
              aria-pressed={mine === it.id}
              aria-label={`Vote for ${it.title}, ${it.votes} votes`}
              onClick={() => {
                const was = mine === it.id;
                setMine(was ? null : it.id);
                vote(it.id, was ? -1 : 1);
              }}
              className={cn(
                "flex w-10 flex-col items-center rounded-lg py-0.5 text-xs font-semibold tabular-nums transition-colors",
                mine === it.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:text-primary",
              )}
            >
              <ChevronUp aria-hidden className="size-3.5" strokeWidth={2.5} />
              {it.votes}
            </button>
            <span className="flex-1 truncate text-sm font-medium">{it.title}</span>
            <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Status moves along                                                */
/* ------------------------------------------------------------------ */

const STATUSES = [
  { label: "Open", note: "Thanks! We're reading every request.", tone: "bg-muted text-muted-foreground" },
  { label: "Planned", note: "On the list for the next release.", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { label: "Done", note: "Shipped in 2.4. Update and enjoy!", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
];

function StatusDemo() {
  const [step, setStep] = useState(0);
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STATUSES.length), 2000);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const s = STATUSES[step];
  return (
    <div ref={ref} className="w-full max-w-[340px] rounded-xl bg-popover p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-14px_rgba(0,0,0,0.22)] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Offline sync</p>
          <p className="text-xs text-muted-foreground">96 votes · 14 following</p>
        </div>
        <span
          key={s.label}
          className={cn("lv2-rise rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.tone)}
        >
          {s.label}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-1.5" aria-hidden>
        {STATUSES.map((x, i) => (
          <span key={x.label} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full origin-left rounded-full bg-primary transition-transform duration-700 ease-out"
              style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2.5 rounded-lg bg-muted/60 p-3">
        <span className="mt-0.5 size-5 shrink-0 rounded-full bg-primary/15 ring-1 ring-primary/30" aria-hidden />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold">
            You <span className="ml-1 rounded bg-primary/15 px-1 py-px text-[9px] text-primary uppercase">Developer</span>
          </p>
          <p key={s.note} className="lv2-rise text-xs text-muted-foreground">
            {s.note}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. The email that brings people back                                 */
/* ------------------------------------------------------------------ */

const MAILS = [
  "Dark mode is Done",
  "Offline sync is Done",
  "Export to CSV is Done",
  "Home screen widget is Done",
  "Keyboard shortcuts is Done",
];

function NotifyDemo() {
  const [count, setCount] = useState(1);
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setCount((c) => c + 1), 2600);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const visible = Array.from({ length: Math.min(3, count) }, (_, i) => count - 1 - i);
  return (
    <div ref={ref} className="w-full max-w-[340px] space-y-2">
      {visible.map((n, i) => (
        <div
          key={n}
          className={cn(
            "flex items-center gap-3 rounded-xl bg-popover p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-14px_rgba(0,0,0,0.22)] dark:shadow-none transition-opacity duration-500",
            i === 0 && "lv2-rise",
            i > 0 && "opacity-60",
            i > 1 && "opacity-30",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{MAILS[n % MAILS.length]}</p>
            <p className="truncate text-xs text-muted-foreground">You asked for it, and it just shipped.</p>
          </div>
          {i === 0 && <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. The board takes your app's look                                   */
/* ------------------------------------------------------------------ */

const SWATCHES = [
  { name: "Orange", value: "oklch(0.66 0.19 42)" },
  { name: "Blue", value: "oklch(0.6 0.19 255)" },
  { name: "Green", value: "oklch(0.62 0.16 150)" },
  { name: "Pink", value: "oklch(0.63 0.22 0)" },
  { name: "Violet", value: "oklch(0.56 0.22 295)" },
];

function ThemeDemo() {
  const [accent, setAccent] = useState(0);
  const [dark, setDark] = useState(false);
  const [round, setRound] = useState(true);
  const radius = round ? 14 : 4;

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-3">
      <div
        className={cn(
          "p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-14px_rgba(0,0,0,0.22)] dark:shadow-none transition-all duration-500",
          dark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900",
        )}
        style={{ borderRadius: radius + 4 }}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold">Requests</span>
          <span
            className="px-2 py-1 text-[10px] font-semibold text-white transition-all duration-500"
            style={{ background: SWATCHES[accent].value, borderRadius: radius }}
          >
            Suggest
          </span>
        </div>
        {["Dark mode", "Widgets"].map((t, i) => (
          <div
            key={t}
            className={cn(
              "flex items-center gap-2 p-1.5 transition-all duration-500 not-last:mb-1.5",
              dark ? "bg-white/[0.06]" : "bg-neutral-100",
            )}
            style={{ borderRadius: radius }}
          >
            <span
              className="grid h-7 w-7 place-items-center text-[10px] font-bold transition-all duration-500"
              style={{
                borderRadius: Math.max(radius - 4, 2),
                background: i === 0 ? SWATCHES[accent].value : "transparent",
                color: i === 0 ? "white" : SWATCHES[accent].value,
                boxShadow: i === 0 ? "none" : `inset 0 0 0 1px ${SWATCHES[accent].value}`,
              }}
            >
              {i === 0 ? 42 : 17}
            </span>
            <span className="text-[11px] font-medium">{t}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-full bg-popover px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-14px_rgba(0,0,0,0.22)] dark:shadow-none">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Accent colour">
          {SWATCHES.map((s, i) => (
            <button
              key={s.name}
              type="button"
              role="radio"
              aria-checked={accent === i}
              aria-label={s.name}
              onClick={() => setAccent(i)}
              className={cn(
                "size-6 rounded-full transition-transform hover:scale-110",
                accent === i && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
              )}
              style={{ background: s.value }}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={dark ? "Light preview" : "Dark preview"}
            onClick={() => setDark((d) => !d)}
            className="grid size-7 place-items-center rounded-full hover:bg-muted hover:text-primary"
          >
            {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
          <button
            type="button"
            aria-label={round ? "Square corners" : "Round corners"}
            onClick={() => setRound((r) => !r)}
            className="grid size-7 place-items-center rounded-full hover:bg-muted hover:text-primary"
          >
            <span className={cn("size-3 border-[1.5px] border-current transition-all", round ? "rounded-[3px]" : "rounded-full")} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Bento() {
  return (
    <div className="grid md:grid-cols-2">
      <BentoCell
        className="md:border-r"
        title="Votes settle the argument"
        body="The loudest person stops winning. The top of the board is simply what most people asked for. Try voting."
      >
        <RankingDemo />
      </BentoCell>
      <BentoCell
        title="Status your users can see"
        body="Open, Planned, Done or Declined, with a short note, so nobody wonders if you read it."
      >
        <StatusDemo />
      </BentoCell>
      <BentoCell
        className="border-t md:border-r"
        title="They hear back when it ships"
        body="Everyone who followed a request gets an email the day it's Done. That's usually the day they reopen your app."
      >
        <NotifyDemo />
      </BentoCell>
      <BentoCell
        className="border-t"
        title="A board that looks like your app"
        body="It picks up your colours and corner radius, so it never feels bolted on. Pick a colour and see."
      >
        <ThemeDemo />
      </BentoCell>
    </div>
  );
}
