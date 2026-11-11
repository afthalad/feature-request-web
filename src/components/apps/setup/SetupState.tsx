"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronUp, Copy, KeyRound, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SetupGuide {
  id: string;
  name: string;
  href: string;
  iconPath: string;
  iconColor?: string;
}

export interface SetupApp {
  id: string;
  name: string;
  /** Whether the owner gets an email for each new request. */
  emailsOwner: boolean;
}

const VARIANTS = [
  { id: "waiting", label: "Waiting" },
  { id: "steps", label: "Steps" },
  { id: "preview", label: "Preview" },
  { id: "try", label: "Try it" },
] as const;
type Variant = (typeof VARIANTS)[number]["id"];
const STORAGE_KEY = "fewchurs.setupVariant";

/**
 * What the dashboard shows while an account's apps have no requests yet. Four layouts of the
 * same message ("we're waiting for your first feedback, here's how to get it"), switchable while
 * we decide which one to keep.
 */
export function SetupState({
  app,
  guides,
  showSwitcher,
}: {
  app: SetupApp;
  guides: SetupGuide[];
  showSwitcher: boolean;
}) {
  const [variant, setVariant] = useState<Variant>("waiting");

  useEffect(() => {
    if (!showSwitcher) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (VARIANTS.some((v) => v.id === saved)) setVariant(saved as Variant);
    } catch {}
  }, [showSwitcher]);

  const choose = (next: Variant) => {
    setVariant(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  return (
    <div className="space-y-3">
      {showSwitcher && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-xs">Layout</span>
          <div role="radiogroup" aria-label="Setup layout" className="bg-surface inline-flex rounded-lg p-0.5">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={variant === v.id}
                onClick={() => choose(v.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  variant === v.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {variant === "waiting" && <WaitingLayout app={app} guides={guides} />}
      {variant === "steps" && <StepsLayout app={app} guides={guides} />}
      {variant === "preview" && <PreviewLayout app={app} guides={guides} />}
      {variant === "try" && <TryLayout app={app} guides={guides} />}
    </div>
  );
}

type LayoutProps = { app: SetupApp; guides: SetupGuide[] };

/* ───────────────────────── Layouts ───────────────────────── */

function WaitingLayout({ app, guides }: LayoutProps) {
  const [open, setOpen] = useState<"self" | "idea" | null>(null);
  return (
    <Card>
      <WaitingBadge />
      <h2 className="mt-4 text-xl font-semibold tracking-tight">Waiting for your first feedback</h2>
      <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
        Once the feedback button is in {app.name}, ideas from your users will show up right here.
        {app.emailsOwner && " We'll also email you when the first one arrives."}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <DeveloperButton app={app} guides={guides} />
        <Button variant="outline" onClick={() => setOpen(open === "self" ? null : "self")} aria-expanded={open === "self"}>
          I&apos;ll set it up myself
        </Button>
        <Button variant="ghost" onClick={() => setOpen(open === "idea" ? null : "idea")} aria-expanded={open === "idea"}>
          Add the first idea yourself
        </Button>
      </div>
      {open === "self" && <SelfSetup app={app} guides={guides} className="mt-5" />}
      {open === "idea" && <FirstIdeaForm app={app} className="mt-5" />}
    </Card>
  );
}

function StepsLayout({ app, guides }: LayoutProps) {
  const [selfOpen, setSelfOpen] = useState(false);
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Get feedback from your users</h2>
          <p className="text-muted-foreground text-sm">Three steps. You&apos;ve already done the first.</p>
        </div>
        <p className="text-muted-foreground text-xs font-medium tabular-nums">1 of 3 done</p>
      </div>
      <div className="bg-border mt-4 h-1 overflow-hidden rounded-full" aria-hidden>
        <div className="bg-primary h-full w-1/3 rounded-full" />
      </div>
      <ol className="mt-6 space-y-6">
        <Step state="done" title="Create your app" />
        <Step
          state="current"
          number={2}
          title="Add the feedback button to your app"
          description="A developer can do this in a few minutes. Send them the steps, or follow them yourself."
        >
          <div className="flex flex-wrap gap-2">
            <DeveloperButton app={app} guides={guides} size="sm" />
            <Button variant="outline" size="sm" onClick={() => setSelfOpen(!selfOpen)} aria-expanded={selfOpen}>
              I&apos;ll do it myself
            </Button>
          </div>
          {selfOpen && <SelfSetup app={app} guides={guides} />}
        </Step>
        <Step
          state="upcoming"
          number={3}
          title="Wait for your first idea"
          description={`It appears here as soon as a user sends one.${app.emailsOwner ? " We'll email you too." : ""}`}
        >
          <WaitingBadge />
        </Step>
      </ol>
    </Card>
  );
}

function PreviewLayout({ app, guides }: LayoutProps) {
  const [selfOpen, setSelfOpen] = useState(false);
  return (
    <Card className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div>
        <WaitingBadge />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">This is what your users will see</h2>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
          A Feedback button in {app.name}. Users share ideas and vote for the ones they want most, and
          you see them all here, most wanted first.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <DeveloperButton app={app} guides={guides} />
          <Button variant="outline" onClick={() => setSelfOpen(!selfOpen)} aria-expanded={selfOpen}>
            I&apos;ll set it up myself
          </Button>
        </div>
        {selfOpen && <SelfSetup app={app} guides={guides} className="mt-5" />}
      </div>
      <BoardPreview appName={app.name} />
    </Card>
  );
}

function TryLayout({ app, guides }: LayoutProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold tracking-tight">Start with one idea</h2>
      <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
        What do your users ask for most? Add it here to see how your board works. It&apos;s a real
        request, and you can delete it any time.
      </p>
      <FirstIdeaForm app={app} className="mt-5" autoFocus />
      <div className="border-border mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-5 text-sm">
        <span className="text-muted-foreground">Ready to hear from real users?</span>
        <DeveloperButton app={app} guides={guides} size="sm" variant="outline" />
      </div>
    </Card>
  );
}

/* ───────────────────────── Shared pieces ───────────────────────── */

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section aria-label="Getting started" className={cn("bg-surface rounded-xl p-5 sm:p-7", className)}>
      {children}
    </section>
  );
}

function WaitingBadge() {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium">
      <span className="relative flex size-2">
        <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" />
        <span className="bg-primary relative inline-flex size-2 rounded-full" />
      </span>
      Waiting for feedback
    </span>
  );
}

function Step({
  state,
  number,
  title,
  description,
  children,
}: {
  state: "done" | "current" | "upcoming";
  number?: number;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-4" aria-current={state === "current" ? "step" : undefined}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          state === "done" && "bg-primary text-primary-foreground",
          state === "current" && "ring-primary text-primary ring-2 ring-inset",
          state === "upcoming" && "ring-border text-muted-foreground ring-1 ring-inset",
        )}
      >
        {state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-label="Done" /> : number}
      </span>
      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
        <div className="space-y-1">
          <p
            className={cn(
              "font-medium",
              state === "done" && "text-muted-foreground line-through decoration-1",
              state === "upcoming" && "text-muted-foreground",
            )}
          >
            {title}
          </p>
          {description && <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">{description}</p>}
        </div>
        {children}
      </div>
    </li>
  );
}

/** The API key link and the setup guides, for people doing it themselves. */
function SelfSetup({ app, guides, className }: LayoutProps & { className?: string }) {
  return (
    <div className={cn("border-border space-y-3 rounded-lg border p-4", className)}>
      <p className="text-sm">
        Pick the guide for how {app.name} is built. You&apos;ll need your API key, which is in settings.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/apps/${app.id}/settings#api-key`} className={buttonVariants({ size: "sm" })}>
          <KeyRound />
          API key
        </Link>
        {guides.map((guide) => (
          <Link key={guide.id} href={guide.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <BrandIcon path={guide.iconPath} color={guide.iconColor} className="size-3.5" />
            {guide.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function developerMessage(app: SetupApp, guides: SetupGuide[], origin: string) {
  const links = guides.map((g) => `- ${g.name}: ${origin}${g.href}`).join("\n");
  return {
    subject: `Can you add the Fewchurs feedback button to ${app.name}?`,
    body: `Hi,

Could you add the Fewchurs feedback button to ${app.name}? It lets our users suggest features and vote on them. It should only take a few minutes.

Setup guide (pick the one for our stack):
${links}

You'll also need our API key. I'll send it to you separately.

Thanks!`,
  };
}

function DeveloperButton({
  app,
  guides,
  size,
  variant = "default",
}: LayoutProps & { size?: "sm"; variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const message = developerMessage(app, guides, origin);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${message.subject}\n\n${message.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Send />
        Send setup to my developer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send this to your developer</DialogTitle>
            <DialogDescription>
              It has everything they need except your API key. Send that separately, it&apos;s in
              Settings.
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted text-foreground max-h-72 overflow-auto rounded-lg p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap">
            {message.body}
          </pre>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={copy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy message"}
            </Button>
            <a
              href={`mailto:?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`}
              className={buttonVariants()}
            >
              <Mail />
              Open in email
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FirstIdeaForm({ app, className, autoFocus }: { app: SetupApp; className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const tooShort = title.trim().length < 3;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (tooShort || saving) return;
    setSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Please sign in again.");
      const response = await fetch(`/api/internal/apps/${app.id}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "We couldn't add that idea.");
      }
      toast.success("Added to your board");
      router.push(`/dashboard/apps/${app.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't add that idea.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <label htmlFor="first-idea" className="sr-only">
        Your first idea
      </label>
      <Input
        id="first-idea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Dark mode"
        maxLength={100}
        autoFocus={autoFocus}
        className="sm:max-w-sm"
      />
      <Button type="submit" disabled={tooShort || saving}>
        {saving ? "Adding…" : "Add idea"}
      </Button>
    </form>
  );
}

const SAMPLE_IDEAS = [
  { title: "Dark mode", votes: 24, status: "Planned" },
  { title: "Export to CSV", votes: 11, status: "Open" },
  { title: "Offline mode", votes: 6, status: "Open" },
];

/** A static picture of the board, labelled as an example so nobody mistakes it for real data. */
function BoardPreview({ appName }: { appName: string }) {
  return (
    <figure aria-label="Example of the feedback board your users see" className="relative">
      <div className="border-border bg-background overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex items-center gap-1.5 border-b px-3 py-2">
          <span className="bg-muted size-2 rounded-full" />
          <span className="bg-muted size-2 rounded-full" />
          <span className="bg-muted size-2 rounded-full" />
          <span className="text-muted-foreground ml-2 truncate text-[11px]">{appName}</span>
          <span className="bg-muted text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
            Example
          </span>
        </div>
        <div className="space-y-2 p-4">
          <p className="text-sm font-semibold">Feature requests</p>
          {SAMPLE_IDEAS.map((idea) => (
            <div key={idea.title} className="border-border flex items-center gap-3 rounded-lg border p-2">
              <span className="border-border flex w-9 flex-col items-center rounded-md border py-0.5 text-[11px] font-semibold tabular-nums">
                <ChevronUp className="size-3" strokeWidth={2.5} aria-hidden />
                {idea.votes}
              </span>
              <span className="flex-1 truncate text-sm">{idea.title}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  idea.status === "Planned" ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-muted text-muted-foreground",
                )}
              >
                {idea.status}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-end p-3 pt-0">
          <span className="bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-md">
            Feedback
          </span>
        </div>
      </div>
    </figure>
  );
}
