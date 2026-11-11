"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** A headline with a real switch in the middle of the sentence. */
export function ToggleHeadline() {
  const [on, setOn] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-[clamp(2.1rem,5.4vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
        Stop guessing.{" "}
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Listen to your users"
          onClick={() => setOn((v) => !v)}
          className={cn(
            "relative mx-1 inline-flex h-[0.82em] w-[1.6em] translate-y-[0.08em] items-center rounded-full align-baseline transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
            on ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-[0.07em] left-[0.07em] size-[0.68em] rounded-full bg-white shadow-md transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              on ? "translate-x-[0.78em]" : "translate-x-0",
            )}
          />
        </button>{" "}
        <span className="relative inline-grid align-baseline">
          <span
            className={cn(
              "col-start-1 row-start-1 transition-all duration-500",
              on ? "translate-y-0 opacity-100 blur-0" : "-translate-y-3 opacity-0 blur-sm",
            )}
            aria-hidden={!on}
          >
            Start <span className="text-primary">listening.</span>
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 text-muted-foreground transition-all duration-500",
              on ? "translate-y-3 opacity-0 blur-sm" : "translate-y-0 opacity-100 blur-0",
            )}
            aria-hidden={on}
          >
            Keep guessing.
          </span>
        </span>
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {on
          ? "Every idea lands on one board, the most wanted rise to the top, and the people who asked hear back the day you ship it."
          : "Feedback scattered across App Store reviews, emails and DMs. The loudest person wins, and nobody hears back."}
      </p>
    </div>
  );
}
