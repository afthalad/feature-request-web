import type { ReactNode } from "react";
import {
  Ban,
  Bell,
  CalendarCheck,
  Languages,
  ChevronUp,
  Check,
  Link2,
  Mail,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/components/features/StatusBadge";
import type { FeatureStatus } from "@/types";

/**
 * Main-feature highlights: one feature per row, copy on one side and a small
 * product mockup on the other, alternating sides row by row.
 */
export function FeatureHighlights() {
  return (
    <div className="space-y-6">
      {HIGHLIGHTS.map((h, i) => (
        <HighlightRow key={h.title} {...h} reverse={i % 2 === 1} />
      ))}
    </div>
  );
}

const HIGHLIGHTS: {
  eyebrow: string;
  title: string;
  body: string;
  visual: ReactNode;
}[] = [
  {
    eyebrow: "Collect",
    title: "One place for every idea",
    body: "Users suggest features right inside your app. You review each one, plan it, reply or decline, all from one dashboard.",
    visual: <ReviewVisual />,
  },
  {
    eyebrow: "Understand",
    title: "Read requests in any language",
    body: "Users write in whatever language they speak. One click translates a request into yours, and it's saved, so it's instant next time.",
    visual: <TranslateVisual />,
  },
  {
    eyebrow: "Prioritize",
    title: "Let users decide",
    body: "Votes rank every request, so the top of the board is what most people want. No more guessing.",
    visual: <VotesVisual />,
  },
  {
    eyebrow: "Respond",
    title: "Reply right in the thread",
    body: "Answer any request where it was asked. Your replies carry a Developer badge, so people know you read it.",
    visual: <ReplyVisual />,
  },
  {
    eyebrow: "Ship",
    title: "Tell them when it ships",
    body: "Mark a request Done and everyone who voted or followed it gets an email. That's usually the day they open your app again.",
    visual: <NotifyVisual />,
  },
  {
    eyebrow: "Share",
    title: "A public board, no SDK needed",
    body: "Every app gets a link like fewchurs.com/b/yourapp. Post it anywhere, and anyone can vote without signing up.",
    visual: <PublicBoardVisual />,
  },
];

function HighlightRow({
  eyebrow,
  title,
  body,
  visual,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  visual: ReactNode;
  reverse: boolean;
}) {
  return (
    <article className="grid grid-cols-1 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2">
      <div
        className={cn(
          "flex flex-col justify-center gap-4 p-8 sm:p-12",
          reverse && "md:order-2"
        )}
      >
        <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </span>
        <h3 className="text-3xl font-bold text-balance sm:text-4xl">{title}</h3>
        <p className="text-muted-foreground max-w-md text-base leading-relaxed sm:text-lg">
          {body}
        </p>
      </div>
      <div className="p-2 sm:p-3">
        <div
          aria-hidden
          className="flex h-full min-h-72 items-center justify-center rounded-[1.25rem] bg-muted px-5 py-8 sm:px-8"
        >
          <div className="w-full max-w-md">{visual}</div>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------- visuals */

const PILL_CLASS: Record<FeatureStatus, string> = {
  open: "bg-muted text-muted-foreground",
  planned: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  declined: "bg-destructive/10 text-destructive",
};

function StatusPill({ status }: { status: FeatureStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        PILL_CLASS[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function MockCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-lift", className)}>
      {children}
    </div>
  );
}

function ReviewVisual() {
  return (
    <div className="space-y-4">
      <MockCard className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Maya Lindqvist</p>
            <p className="text-muted-foreground text-xs">Just now</p>
          </div>
          <StatusPill status="open" />
        </div>
        <p className="text-muted-foreground mt-4 text-[15px]">
          &ldquo;Sync my habits across iPhone and iPad&rdquo;
        </p>
      </MockCard>
      <MockCard className="mx-auto grid w-[88%] grid-cols-3 gap-1.5 p-1.5">
        {[
          { icon: CalendarCheck, label: "Plan it", active: true },
          { icon: MessageSquare, label: "Reply" },
          { icon: Ban, label: "Decline" },
        ].map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium",
              active
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-muted/60 text-foreground"
            )}
          >
            <Icon className="size-4" strokeWidth={1.8} />
            {label}
          </div>
        ))}
      </MockCard>
    </div>
  );
}

function TranslateVisual() {
  return (
    <div className="space-y-3">
      <MockCard className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">Modo sin conexión</p>
          <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
            ES
          </span>
        </div>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Quiero registrar mis hábitos cuando no tengo internet.
        </p>
        <span className="text-primary mt-4 inline-flex items-center gap-1.5 text-xs font-medium">
          <Languages className="size-3.5" />
          Translate
        </span>
      </MockCard>
      <MockCard className="border-primary/30 ml-6 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">Offline mode</p>
          <span className="bg-primary-soft text-primary rounded-md px-2 py-0.5 text-xs font-medium">
            EN
          </span>
        </div>
        <p className="text-muted-foreground mt-1.5 text-sm">
          I want to log my habits when I don&apos;t have internet.
        </p>
        <span className="text-muted-foreground mt-4 inline-flex items-center gap-1.5 text-xs">
          <Languages className="size-3.5" />
          Show original
        </span>
      </MockCard>
    </div>
  );
}

const THREAD: { name: string; text: string; time: string; dev?: boolean }[] = [
  { name: "Sam Okafor", text: "Would love widgets for the lock screen too!", time: "2h ago" },
  {
    name: "You",
    text: "Planned for the next release. Lock screen is included.",
    time: "1h ago",
    dev: true,
  },
  { name: "Priya Nair", text: "Amazing, thank you 🙌", time: "12m ago" },
];

function ReplyVisual() {
  return (
    <MockCard className="p-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <p className="text-sm font-semibold">Home screen widgets</p>
        <StatusPill status="planned" />
      </div>
      <div className="space-y-3 pt-3">
        {THREAD.map((c) => (
          <div key={c.name} className="flex items-start gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                c.dev ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {c.name.charAt(0)}
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium">{c.name}</span>
                {c.dev && (
                  <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                    Developer
                  </span>
                )}
                <span className="text-muted-foreground text-xs">{c.time}</span>
              </div>
              <p
                className={cn(
                  "w-fit rounded-lg px-3 py-1.5 text-sm",
                  c.dev ? "bg-primary-soft" : "bg-muted"
                )}
              >
                {c.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MockCard>
  );
}

const VOTE_ROWS: { title: string; body: string; votes?: number; status: FeatureStatus }[] = [
  { title: "Dark mode", body: "A dark theme that follows the system", status: "done" },
  { title: "Offline mode", body: "Log habits without a connection", votes: 285, status: "in_progress" },
  { title: "Home screen widgets", body: "See today's streak at a glance", votes: 190, status: "planned" },
];

function VotesVisual() {
  return (
    <MockCard className="space-y-2.5 p-3">
      {VOTE_ROWS.map((r) => (
        <div key={r.title} className="flex gap-3 rounded-xl border border-border p-3">
          {r.votes ? (
            <div className="bg-muted flex w-11 shrink-0 flex-col items-center justify-center rounded-lg py-1.5">
              <ChevronUp className="text-muted-foreground size-4" />
              <span className="text-xs font-semibold tabular-nums">{r.votes}</span>
            </div>
          ) : (
            <div className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
                <Check className="size-3 text-white" strokeWidth={3} />
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{r.title}</p>
              <MoreVertical className="text-muted-foreground size-4 shrink-0" />
            </div>
            <p className="text-muted-foreground truncate text-xs">{r.body}</p>
            <div className="mt-2">
              <StatusPill status={r.status} />
            </div>
          </div>
        </div>
      ))}
    </MockCard>
  );
}

function NotifyVisual() {
  return (
    <div className="relative pt-6">
      <MockCard className="p-5">
        <div className="flex items-center gap-3">
          <span className="bg-primary-soft text-primary flex size-9 items-center justify-center rounded-full">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Habits</p>
            <p className="text-muted-foreground truncate text-xs">to 214 people who voted or followed</p>
          </div>
        </div>
        <p className="mt-4 font-semibold">Dark mode is live 🎉</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          You asked for it, and it just shipped. Update the app to try it.
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <StatusPill status="done" />
          <span className="text-muted-foreground text-xs">Sent automatically</span>
        </div>
      </MockCard>
      <div className="absolute -top-1 right-4 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-lift">
        <Bell className="text-primary size-3.5" />
        214 notified
      </div>
    </div>
  );
}

function PublicBoardVisual() {
  return (
    <MockCard className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="bg-border size-2.5 rounded-full" />
          ))}
        </div>
        <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-card px-2.5 py-1 text-xs">
          <Link2 className="size-3 shrink-0" />
          <span className="truncate">fewchurs.com/b/habits</span>
        </div>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Feature requests</p>
          <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[11px] font-medium">
            No login needed
          </span>
        </div>
        {[
          { title: "Offline mode", votes: 286, voted: true },
          { title: "Home screen widgets", votes: 190 },
          { title: "CSV export", votes: 74 },
        ].map((r) => (
          <div key={r.title} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
            <div
              className={cn(
                "flex w-10 shrink-0 flex-col items-center rounded-lg py-1",
                r.voted ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <ChevronUp className="size-3.5" />
              <span className="text-[11px] font-semibold tabular-nums">{r.votes}</span>
            </div>
            <p className="text-sm font-medium">{r.title}</p>
          </div>
        ))}
      </div>
    </MockCard>
  );
}
