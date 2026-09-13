import { Check, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureStatus } from "@/types";

interface FeatureVoteIndicatorProps {
  status: FeatureStatus;
  upvoteCount: number;
  hasVoted?: boolean;
  onClick?: () => void;
  hideCount?: boolean;
}

export function FeatureVoteIndicator({
  status,
  upvoteCount,
  hasVoted,
  onClick,
  hideCount,
}: FeatureVoteIndicatorProps) {
  if (status === "done") {
    const className = "flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white";
    return onClick ? (
      <button type="button" onClick={onClick} className={className}>
        <Check className="size-4" />
      </button>
    ) : (
      <div className={className}>
        <Check className="size-4" />
      </div>
    );
  }

  const className = cn(
    "flex size-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors",
    hasVoted ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary",
    onClick && "hover:bg-primary/20"
  );

  const content = (
    <>
      <ChevronUp className="size-3.5" />
      {!hideCount && <span className="leading-none">{upvoteCount}</span>}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className} aria-pressed={hasVoted}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
