"use client";

import { useEffect, useState } from "react";
import { ChevronUp, Plus } from "lucide-react";

type Row = { id: string; title: string; votes: number; status: keyof typeof DOT; bumped?: number };

const DOT = {
  open: "bg-zinc-400",
  planned: "bg-blue-400",
  in_progress: "bg-amber-400",
  done: "bg-emerald-400",
};
const LABEL = { open: "Pending", planned: "Planned", in_progress: "In progress", done: "Done" };

const START: Row[] = [
  { id: "dark", title: "Dark mode", votes: 128, status: "in_progress" },
  { id: "widget", title: "Home screen widget", votes: 119, status: "planned" },
  { id: "csv", title: "Export to CSV", votes: 96, status: "planned" },
  { id: "watch", title: "Apple Watch app", votes: 88, status: "open" },
  { id: "teams", title: "Team workspaces", votes: 71, status: "open" },
  { id: "sync", title: "iCloud sync", votes: 64, status: "done" },
];

const ROW_H = 64;

/** A phone showing the board the SDK renders, with votes coming in live. */
export function PhoneBoard() {
  const [rows, setRows] = useState(START);

  useEffect(() => {
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
  }, []);

  const order = new Map(rows.map((r, i) => [r.id, i]));

  return (
    <div className="relative mx-auto w-[280px] rounded-[44px] border border-white/15 bg-[#0b0b0b] p-2.5 shadow-[0_40px_120px_-30px_rgb(255_90_20/45%)] sm:w-[300px]">
      <div className="relative overflow-hidden rounded-[36px] bg-[#151515]">
        {/* status bar + notch */}
        <div className="flex h-10 items-center justify-between px-7 text-[11px] font-semibold text-white/80">
          <span>9:41</span>
          <span className="h-5 w-20 rounded-full bg-black" />
          <span>100%</span>
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <p className="text-lg font-bold tracking-[-0.02em] text-white">Feature requests</p>
          <span className="grid size-8 place-items-center rounded-full bg-[#ff5a14] text-white">
            <Plus className="size-4" strokeWidth={3} />
          </span>
        </div>
        <div className="mx-5 mb-3 grid grid-cols-3 rounded-lg bg-white/[0.06] p-1 text-center text-[11px] font-semibold">
          <span className="rounded-md bg-white/10 py-1 text-white">Top</span>
          <span className="py-1 text-white/50">New</span>
          <span className="py-1 text-white/50">Roadmap</span>
        </div>
        <div className="relative mx-3" style={{ height: ROW_H * START.length }}>
          {START.map(({ id }) => {
            const r = rows.find((x) => x.id === id)!;
            return (
              <div
                key={id}
                className="absolute inset-x-0 flex items-center gap-3 px-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ height: ROW_H, transform: `translateY(${order.get(id)! * ROW_H}px)` }}
              >
                <span
                  key={r.bumped}
                  className="v2-bump flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white"
                >
                  <ChevronUp className="size-3.5" strokeWidth={3} />
                  <span className="text-xs font-bold tabular-nums">{r.votes}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/50">
                    <span className={`size-1.5 rounded-full ${DOT[r.status]}`} />
                    {LABEL[r.status]}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="p-4 pt-2">
          <div className="rounded-xl bg-[#ff5a14] py-3 text-center text-sm font-bold text-white">Suggest a feature</div>
        </div>
      </div>
    </div>
  );
}
