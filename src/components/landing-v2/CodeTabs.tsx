"use client";

import { useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

/** Snippets for platforms whose entry in PLATFORMS has none yet. */
const EXTRA_SNIPPETS: Record<string, { filename: string; code: string }> = {
  flutter: {
    filename: "lib/main.dart",
    code: `import 'package:fewchurs/fewchurs.dart';

void main() {
  Fewchurs.configure(apiKey: 'fr_live_xxx');
  runApp(const MyApp());
}

// Anywhere in your app
Fewchurs.showBoard(context);`,
  },
};

const TABS = PLATFORMS.map((p) => ({ ...p, codeSnippet: p.codeSnippet ?? EXTRA_SNIPPETS[p.id] })).filter(
  (p) => p.codeSnippet,
);

/** Colours string literals and comments; everything else stays plain. */
function highlight(line: string) {
  const parts = line.split(/("[^"]*"|'[^']*'|(?:^|\s)\/\/.*$)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.trimStart().startsWith("//")) return <span key={i} className="text-muted-foreground italic">{part}</span>;
    if (/^["']/.test(part)) return <span key={i} className="text-primary">{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

export function CodeTabs() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const tab = TABS[active];
  const lines = tab.codeSnippet!.code.split("\n");

  const select = (i: number) => {
    setActive(i);
    setCopied(false);
    tabRefs.current[i]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") select((active + 1) % TABS.length);
    else if (e.key === "ArrowLeft") select((active - 1 + TABS.length) % TABS.length);
    else if (e.key === "Home") select(0);
    else if (e.key === "End") select(TABS.length - 1);
    else return;
    e.preventDefault();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.codeSnippet!.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the code is still selectable.
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
      <div
        role="tablist"
        aria-label="Platform"
        onKeyDown={onKeyDown}
        className="flex overflow-x-auto border-b border-border [scrollbar-width:none]"
      >
        {TABS.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${baseId}-tab-${p.id}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
              i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BrandIcon
              path={p.iconPath}
              color={i === active ? p.iconColor : undefined}
              className="size-3.5 transition-colors"
            />
            {p.name}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-300",
                i === active ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${tab.id}`}
        className="relative"
      >
        <div className="flex items-center justify-between px-4 pt-3 font-mono text-[11px] text-muted-foreground">
          <span>{tab.codeSnippet!.filename}</span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre key={tab.id} className="lv2-rise overflow-x-auto px-4 pt-2 pb-5 font-mono text-[13px] leading-6">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="block">
                <span aria-hidden className="mr-4 inline-block w-5 text-right text-muted-foreground/50 select-none">
                  {i + 1}
                </span>
                {highlight(line)}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
