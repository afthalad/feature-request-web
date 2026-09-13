"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import type { Plan } from "@/types";

interface ExportReportButtonProps {
  appId: string;
  plan: Plan;
}

const PERIODS = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
] as const;

export function ExportReportButton({ appId, plan }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function handleExport(period: string) {
    if (plan !== "pro") {
      setShowUpgrade(true);
      return;
    }

    setIsExporting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/internal/apps/${appId}/export?period=${period}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to export report.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${appId}-${period}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "outline" })}
          disabled={isExporting}
        >
          <Download className="size-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PERIODS.map(({ value, label }) => (
            <DropdownMenuItem key={value} onClick={() => handleExport(value)}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        title="CSV export is a Pro feature"
        description="Upgrade to Pro to export your feature requests as a CSV report."
      />
    </>
  );
}
