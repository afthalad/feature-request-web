"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Same props as components/docs/CodeBlock, in the light card style of the new landing page. */
export function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const numbered = lines.length > 1;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the code is still selectable.
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 py-1 pr-1.5 pl-4 font-mono text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="size-1.5 shrink-0 bg-primary" />
          {filename && <span className="truncate">{filename}</span>}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto py-3.5 pr-4 font-mono text-[13px] leading-6">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="block pl-4">
              {numbered && (
                <span aria-hidden className="mr-4 inline-block w-5 text-right text-muted-foreground/50 select-none">
                  {i + 1}
                </span>
              )}
              {highlight(line)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** Colours string literals and comments; everything else stays plain. */
function highlight(line: string) {
  const parts = line.split(/("[^"]*"|'[^']*'|(?:^|\s)\/\/.*$|^\s*#.*$)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^\s*(\/\/|#)/.test(part)) {
      return (
        <span key={i} className="text-muted-foreground italic">
          {part}
        </span>
      );
    }
    if (/^["']/.test(part)) {
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
