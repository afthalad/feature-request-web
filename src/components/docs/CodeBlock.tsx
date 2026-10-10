"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the code is still selectable.
    }
  }

  const button = (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      className="text-ink-foreground/60 hover:text-ink-foreground flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/10"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );

  return (
    <div className="bg-ink relative overflow-hidden rounded-lg border border-border">
      {filename ? (
        <div className="text-ink-foreground/60 flex items-center justify-between gap-3 border-b border-white/10 py-1 pr-1.5 pl-4 font-mono text-xs">
          <span className="truncate">{filename}</span>
          {button}
        </div>
      ) : (
        <div className="absolute top-2 right-2">{button}</div>
      )}
      <pre
        className={`text-ink-foreground overflow-x-auto p-4 font-mono text-[13px] leading-relaxed ${filename ? "" : "pr-12"}`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
