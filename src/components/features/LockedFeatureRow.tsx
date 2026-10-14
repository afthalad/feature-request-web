import Link from "next/link";
import { Lock } from "lucide-react";
import { FeatureVoteIndicator } from "@/components/features/FeatureVoteIndicator";
import { buttonVariants } from "@/components/ui/button";
import type { Feature } from "@/types";

interface LockedFeatureRowProps {
  feature: Feature;
  appName?: string;
}

/**
 * A request past the owner's plan limit. The server only sends a masked title (see lockFeature
 * in src/lib/features/service.ts), so this is a teaser, not hidden content.
 */
export function LockedFeatureRow({ feature, appName }: LockedFeatureRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="self-center opacity-60">
        <FeatureVoteIndicator
          status={feature.status}
          upvoteCount={feature.upvoteCount}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium blur-[3px] select-none" aria-hidden>
          {feature.title}
        </p>
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <Lock className="size-3.5" />
          <span>
            Locked on your plan
            {appName && <> · {appName}</>}
          </span>
        </p>
      </div>
      <Link
        href="/pricing"
        className={buttonVariants({
          variant: "secondary",
          size: "sm",
          className: "self-center",
        })}
      >
        Upgrade to view
      </Link>
    </div>
  );
}
