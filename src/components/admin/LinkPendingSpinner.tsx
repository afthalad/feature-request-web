"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

// Renders only while the nearest ancestor <Link>'s navigation is in flight. Drop it as a child
// of any Link to turn a click into instant visual feedback instead of an apparent dead click
// while the next page's RSC payload is still loading.
export function LinkPendingSpinner({ className = "size-3" }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 className={`shrink-0 animate-spin ${className}`} />;
}
