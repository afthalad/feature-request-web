"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A code sample on a dark card (in both themes), with a copy button. */
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
    <div className="v2-code relative overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-4 font-mono text-xs text-white/50">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="flex gap-1">
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-[var(--v2-orange)]" />
          </span>
          {filename && <span className="truncate pl-1">{filename}</span>}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3.5 text-[var(--v2-orange)]" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto pt-1 pr-4 pb-4 font-mono text-[13px] leading-6 text-white/90">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="block pl-4">
              {numbered && (
                <span aria-hidden className="mr-4 inline-block w-5 text-right text-white/25 select-none">
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
        <span key={i} className="text-white/40 italic">
          {part}
        </span>
      );
    }
    if (/^["']/.test(part)) {
      return (
        <span key={i} className="text-[#ff9a62]">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
