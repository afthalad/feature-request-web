"use client";

import { useState } from "react";
import Link from "next/link";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";

interface NewAppButtonProps {
  atLimit: boolean;
  limitMessage: string;
  className?: string;
  children: React.ReactNode;
}

export function NewAppButton({ atLimit, limitMessage, className, children }: NewAppButtonProps) {
  const [open, setOpen] = useState(false);

  if (!atLimit) {
    return (
      <Link href="/dashboard/apps/new" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <UpgradeDialog
        open={open}
        onOpenChange={setOpen}
        title="You've hit your app limit"
        description={limitMessage}
      />
    </>
  );
}
