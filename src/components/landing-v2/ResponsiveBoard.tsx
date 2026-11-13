"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, MessageSquare, Monitor, Plus, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "mobile" | "web";
type Callout = { title: string; body: string };

/** Logical size of the frame in each mode, and the size the rulers print. */
const SIZES: Record<Mode, { w: number; h: number; label: [string, string] }> = {
  mobile: { w: 300, h: 600, label: ["390", "844"] },
  web: { w: 680, h: 460, label: ["1280", "800"] },
};
const STAGE_H = 640; // fixed, so the page below never jumps while the frame resizes
const CALLOUT_W = 200;
const LINE = 24;
const SIDE_ROOM = CALLOUT_W + LINE + 52; // callout + line + ruler gap, per side
const WIDE = 1000; // from this stage width the callouts hang off the frame's edges
const CYCLE_MS = 4200;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const DURATION = "900ms";

const LEFT_Y = [0.14, 0.45, 0.76];
const RIGHT_Y = [0.22, 0.52, 0.82];

/**
 * The board the SDK renders, in a frame that resizes between a phone and a
 * browser window. The board inside reflows with container queries, exactly as
 * it would in an app, and the callouts and rulers ride along the frame's edges.
 */
export function ResponsiveBoard({ left, right }: { left: Callout[]; right: Callout[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(1152);
  const [mode, setMode] = useState<Mode>("mobile");
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Flip between phone and web while the section is on screen, until someone picks one.
  useEffect(() => {
    if (!inView || !auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setMode((m) => (m === "mobile" ? "web" : "mobile")), CYCLE_MS);
    return () => clearInterval(id);
  }, [inView, auto]);

  const wide = stageW >= WIDE;
  const size = SIZES[mode];
  const maxW = wide ? stageW - SIDE_ROOM * 2 : stageW - 56; // narrow: leave room for the side ruler
  const maxH = STAGE_H - 48;
  const scale = Math.min(1, maxW / size.w, maxH / size.h);
  const vw = size.w * scale;
  const vh = size.h * scale;
  const top = (STAGE_H - 36 - vh) / 2;
  const move = { transitionDuration: DURATION, transitionTimingFunction: EASE };

  const pick = (m: Mode) => {
    setAuto(false);
    setMode(m);
  };

  return (
    <div>
      <div className="flex justify-center">
        <div role="group" aria-label="Preview size" className="inline-flex rounded-full border border-[var(--v2-line)] bg-[var(--v2-card)] p-1 text-sm font-semibold shadow-sm">
          {(["mobile", "web"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pick(m)}
              aria-pressed={mode === m}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors",
                mode === m ? "bg-[var(--v2-orange)] text-white" : "text-[var(--v2-fg-2)] hover:text-[var(--v2-fg)]",
              )}
            >
              {m === "mobile" ? <Smartphone className="size-3.5" /> : <Monitor className="size-3.5" />}
              {m === "mobile" ? "Mobile" : "Web"}
            </button>
          ))}
        </div>
      </div>

      <div ref={stage} className="relative mt-6" style={{ height: STAGE_H }}>
        {/* glow */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[var(--v2-orange)] opacity-25 blur-[90px] transition-all"
          style={{ ...move, width: vw * 0.8, height: 120, top: top + vh - 70 }}
        />

        {/* the frame */}
        <div
          className="v2-frame absolute left-1/2 overflow-hidden border-[6px] transition-[width,height,border-radius,transform,top]"
          style={{
            ...move,
            width: size.w,
            height: size.h,
            top,
            borderRadius: mode === "mobile" ? 40 : 16,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <Board inView={inView} />
        </div>

        {/* rulers */}
        <Ruler
          axis="x"
          label={size.label[0]}
          style={{ ...move, left: `calc(50% - ${vw / 2}px)`, width: vw, top: top + vh + 14 }}
        />
        <Ruler
          axis="y"
          label={size.label[1]}
          style={{ ...move, left: `calc(50% + ${vw / 2 + 16}px)`, height: vh, top }}
        />

        {/* callouts hanging off the frame */}
        {wide &&
          left.map((c, i) => (
            <CalloutPin
              key={c.title}
              side="left"
              {...c}
              style={{ ...move, left: `calc(50% - ${vw / 2 + 10}px)`, top: top + vh * LEFT_Y[i] }}
            />
          ))}
        {wide &&
          right.map((c, i) => (
            <CalloutPin
              key={c.title}
              side="right"
              {...c}
              style={{ ...move, left: `calc(50% + ${vw / 2 + 36}px)`, top: top + vh * RIGHT_Y[i] }}
            />
          ))}
      </div>

      {!wide && (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {[...left, ...right].map((c) => (
            <li key={c.title} className="flex items-start gap-3">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--v2-orange)] shadow-[0_0_10px_var(--v2-orange)]" />
              <span>
                <span className="block font-bold">{c.title}</span>
                <span className="mt-1 block text-sm text-[var(--v2-fg-3)]">{c.body}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalloutPin({ title, body, side, style }: Callout & { side: "left" | "right"; style: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "absolute flex items-start transition-[left,top]",
        side === "left" ? "flex-row-reverse text-right" : "",
      )}
      style={{ ...style, translate: `${side === "left" ? "-100%" : "0"} -10px` }}
    >
      <span className="flex h-5 shrink-0 items-center">
        <span className="size-2.5 rounded-full bg-[var(--v2-orange)] shadow-[0_0_12px_var(--v2-orange)]" />
      </span>
      <span className="flex h-5 shrink-0 items-center px-2">
        <span className="h-px bg-[var(--v2-line-strong)]" style={{ width: LINE }} />
      </span>
      <span style={{ width: CALLOUT_W }}>
        <span className="block leading-5 font-bold">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-[var(--v2-fg-3)]">{body}</span>
      </span>
    </div>
  );
}

function Ruler({ axis, label, style }: { axis: "x" | "y"; label: string; style: React.CSSProperties }) {
  const x = axis === "x";
  return (
    <div
      aria-hidden
      className={cn("absolute transition-[left,top,width,height]", x ? "h-2" : "w-2")}
      style={style}
    >
      {/* line + end ticks */}
      <span className={cn("absolute bg-[var(--v2-line-strong)]", x ? "inset-x-0 top-1/2 h-px" : "inset-y-0 left-1/2 w-px")} />
      <span className={cn("absolute bg-[var(--v2-line-strong)]", x ? "top-0 left-0 h-full w-px" : "top-0 left-0 h-px w-full")} />
      <span className={cn("absolute bg-[var(--v2-line-strong)]", x ? "top-0 right-0 h-full w-px" : "bottom-0 left-0 h-px w-full")} />
      <span
        className={cn(
          "absolute bg-[var(--v2-bg)] px-1.5 font-mono text-[10px] text-[var(--v2-fg-3)] tabular-nums",
          x ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/* ---------- the board itself ---------- */

type Status = "open" | "planned" | "in_progress" | "done";
type Row = { id: string; title: string; votes: number; comments: number; status: Status; bumped?: number };

const DOT: Record<Status, string> = {
  open: "bg-zinc-400",
  planned: "bg-blue-500",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
};
const LABEL: Record<Status, string> = { open: "Pending", planned: "Planned", in_progress: "In progress", done: "Done" };

const START: Row[] = [
  { id: "dark", title: "Dark mode", votes: 128, comments: 14, status: "in_progress" },
  { id: "widget", title: "Home screen widget", votes: 119, comments: 9, status: "planned" },
  { id: "csv", title: "Export to CSV", votes: 96, comments: 6, status: "planned" },
  { id: "watch", title: "Apple Watch app", votes: 88, comments: 11, status: "open" },
  { id: "teams", title: "Team workspaces", votes: 71, comments: 4, status: "open" },
  { id: "sync", title: "iCloud sync", votes: 64, comments: 7, status: "done" },
];

const ROW_H = 60;

function Board({ inView }: { inView: boolean }) {
  const [rows, setRows] = useState(START);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setRows((list) => {
        // Favour the lower rows so the order keeps changing.
        const i = Math.min(list.length - 1, Math.floor(Math.random() ** 0.6 * list.length));
        const pick = list[i];
        const by = 1 + Math.floor(Math.random() * 6);
        return list
          .map((r) => (r.id === pick.id ? { ...r, votes: r.votes + by, bumped: Date.now() } : r))
          .sort((a, b) => b.votes - a.votes);
      });
    }, 1400);
    return () => clearInterval(id);
  }, [inView]);

  const order = new Map(rows.map((r, i) => [r.id, i]));
  const counts = (s: Status) => rows.filter((r) => r.status === s).length;

  return (
    <div className="@container flex size-full flex-col bg-[var(--p-bg)] text-[var(--p-fg)]">
      {/* phone status bar / browser chrome */}
      <div className="flex h-9 shrink-0 items-center justify-between px-6 text-[11px] font-semibold @md:hidden">
        <span>9:41</span>
        <span>100%</span>
      </div>
      <div className="hidden h-10 shrink-0 items-center gap-3 border-b border-[var(--p-line)] bg-[var(--p-chip)] px-4 @md:flex">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto w-1/2 truncate rounded-md bg-[var(--p-active)] px-3 py-1 text-center text-[11px] text-[var(--p-fg-2)]">
          yourapp.com/feedback
        </span>
        <span className="w-10" />
      </div>

      {/* header */}
      <div className="flex shrink-0 items-center justify-between px-5 pt-2 pb-3 @md:px-6 @md:pt-5">
        <div>
          <p className="text-lg font-bold tracking-[-0.02em] @md:text-xl">Feature requests</p>
          <p className="hidden text-xs text-[var(--p-fg-2)] @md:block">Tell us what to build next. Vote on what you want most.</p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-[#ff5a14] text-white @md:hidden">
          <Plus className="size-4" strokeWidth={3} />
        </span>
        <span className="hidden items-center gap-1.5 rounded-lg bg-[#ff5a14] px-3.5 py-2 text-xs font-bold text-white @md:inline-flex">
          <Plus className="size-3.5" strokeWidth={3} />
          Suggest a feature
        </span>
      </div>

      {/* tabs */}
      <div className="mx-5 mb-3 grid shrink-0 grid-cols-3 rounded-lg bg-[var(--p-chip)] p-1 text-center text-[11px] font-semibold @md:mx-6 @md:w-64">
        <span className="rounded-md bg-[var(--p-active)] py-1 shadow-sm">Top</span>
        <span className="py-1 text-[var(--p-fg-2)]">New</span>
        <span className="py-1 text-[var(--p-fg-2)]">Roadmap</span>
      </div>

      {/* list + roadmap */}
      <div className="flex min-h-0 flex-1 gap-4 px-3 @md:px-6">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {START.map(({ id }) => {
            const r = rows.find((x) => x.id === id)!;
            return (
              <div
                key={id}
                className="absolute inset-x-0 flex items-center gap-3 px-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] @md:border-b @md:border-[var(--p-line)] @md:px-0"
                style={{ height: ROW_H, transform: `translateY(${order.get(id)! * ROW_H}px)` }}
              >
                <span
                  key={r.bumped}
                  className="v2-bump flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--p-line)] bg-[var(--p-chip)]"
                >
                  <ChevronUp className="size-3.5" strokeWidth={3} />
                  <span className="text-xs font-bold tabular-nums">{r.votes}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--p-fg-2)] @md:hidden">
                    <span className={`size-1.5 rounded-full ${DOT[r.status]}`} />
                    {LABEL[r.status]}
                  </span>
                </span>
                <span className="hidden items-center gap-1 text-[11px] text-[var(--p-fg-2)] @md:flex">
                  <MessageSquare className="size-3.5" />
                  {r.comments}
                </span>
                <span className="hidden w-24 items-center gap-1.5 rounded-full bg-[var(--p-chip)] px-2.5 py-1 text-[11px] font-medium @md:inline-flex">
                  <span className={`size-1.5 rounded-full ${DOT[r.status]}`} />
                  {LABEL[r.status]}
                </span>
              </div>
            );
          })}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--p-bg)] to-transparent" />
        </div>

        <aside className="hidden w-44 shrink-0 self-start rounded-xl border border-[var(--p-line)] p-4 @xl:block">
          <p className="text-xs font-bold">Roadmap</p>
          <ul className="mt-3 space-y-2.5 text-xs">
            {(["planned", "in_progress", "done"] as const).map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--p-fg-2)]">
                  <span className={`size-1.5 rounded-full ${DOT[s]}`} />
                  {LABEL[s]}
                </span>
                <span className="font-semibold tabular-nums">{counts(s)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[var(--p-line)] pt-3 text-[11px] leading-relaxed text-[var(--p-fg-2)]">
            Follow an idea to get an email when it ships.
          </p>
        </aside>
      </div>

      {/* phone: big button at the bottom */}
      <div className="shrink-0 p-4 pt-2 @md:hidden">
        <div className="rounded-xl bg-[#ff5a14] py-3 text-center text-sm font-bold text-white">Suggest a feature</div>
      </div>
    </div>
  );
}
