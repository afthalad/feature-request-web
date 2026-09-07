"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronUp } from "lucide-react";
import { StatusBadge } from "@/components/features/StatusBadge";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { FeatureStatus } from "@/types";

const SAMPLE_ROWS: { title: string; votes: number; status: FeatureStatus }[] = [
  { title: "Add dark mode", votes: 8, status: "planned" },
  { title: "Sync with calendar", votes: 4, status: "open" },
  { title: "Export to CSV", votes: 2, status: "done" },
];

const ROTATE_MS = 4200;
const TYPE_SPEED_MS = 18;
const FRAME_SWAP_MS = 180;

function FeatureRows({ accentColor }: { accentColor: string }) {
  return (
    <>
      {SAMPLE_ROWS.map((row) => (
        <div key={row.title} className="flex items-center gap-2 rounded-lg border bg-background p-2">
          <div
            className="flex w-8 shrink-0 flex-col items-center transition-colors duration-500"
            style={{ color: accentColor }}
          >
            <ChevronUp className="size-3" />
            <span className="text-xs font-medium">{row.votes}</span>
          </div>
          <p className="min-w-0 flex-1 truncate text-xs font-medium">{row.title}</p>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </>
  );
}

function PhoneFrame({ accentColor }: { accentColor: string }) {
  return (
    <div className="mx-auto w-[260px] rounded-[2.5rem] border-8 border-foreground/90 bg-background p-2">
      <div className="h-5 w-full">
        <div className="mx-auto h-4 w-24 rounded-b-xl bg-foreground/90" />
      </div>
      <div className="space-y-2 rounded-[1.5rem] bg-muted/40 p-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">Feature requests</p>
        <FeatureRows accentColor={accentColor} />
      </div>
    </div>
  );
}

function BrowserFrame({ accentColor, url }: { accentColor: string; url: string }) {
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border-8 border-foreground/90 bg-background">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-2.5 py-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md bg-background/70 px-2 py-1 text-center text-[10px] text-muted-foreground">
          {url}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">Feature requests</p>
        <FeatureRows accentColor={accentColor} />
      </div>
    </div>
  );
}

export function PlatformShowcase() {
  const items = useMemo(() => PLATFORMS.filter((p) => p.codeSnippet), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const active = items[activeIndex];
  const code = active.codeSnippet!.code;
  const deviceType = active.deviceType ?? "mobile";

  const [displayedDeviceType, setDisplayedDeviceType] = useState(deviceType);
  const [frameVisible, setFrameVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (deviceType === displayedDeviceType) {
      setFrameVisible(true);
      return;
    }
    if (reducedMotion) {
      setDisplayedDeviceType(deviceType);
      return;
    }
    setFrameVisible(false);
    const id = setTimeout(() => {
      setDisplayedDeviceType(deviceType);
      setFrameVisible(true);
    }, FRAME_SWAP_MS);
    return () => clearTimeout(id);
  }, [deviceType, displayedDeviceType, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      setTypedLength(code.length);
      return;
    }
    setTypedLength(0);
    const id = setInterval(() => {
      setTypedLength((len) => {
        if (len >= code.length) {
          clearInterval(id);
          return len;
        }
        return len + 1;
      });
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [activeIndex, reducedMotion, code]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearTimeout(id);
  }, [activeIndex, reducedMotion, items.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-muted/30 p-1">
        {items.map((platform, i) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              i === activeIndex
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BrandIcon path={platform.iconPath} color={platform.iconColor} className="size-3.5" />
            {platform.name}
          </button>
        ))}
      </div>

      <div className="flex min-h-[260px] items-center rounded-xl border border-border bg-card p-5 shadow-soft">
        <div
          className={cn(
            "w-full transition-opacity duration-150",
            frameVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {displayedDeviceType === "mobile" ? (
            <PhoneFrame accentColor={active.iconColor} />
          ) : (
            <BrowserFrame accentColor={active.iconColor} url={`yourapp.com/${active.id}`} />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          </div>
          <span className="text-muted-foreground text-xs">{active.codeSnippet!.filename}</span>
        </div>
        <pre className="bg-ink text-ink-foreground min-h-[112px] overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre">
          <code>
            {code.slice(0, typedLength)}
            {!reducedMotion && typedLength < code.length && (
              <span className="-mb-0.5 ml-0.5 inline-block h-[1em] w-[7px] animate-pulse bg-current align-middle" />
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
