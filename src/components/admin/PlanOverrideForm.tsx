"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/types";

const PLANS: Plan[] = ["free", "starter", "pro"];

interface PlanOverrideFormProps {
  uid: string;
  initialPlan: Plan;
  initialSubscriptionStatus?: string;
}

export function PlanOverrideForm({
  uid,
  initialPlan,
  initialSubscriptionStatus,
}: PlanOverrideFormProps) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [subscriptionStatus, setSubscriptionStatus] = useState(initialSubscriptionStatus ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in.");

      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ plan, subscriptionStatus: subscriptionStatus || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Failed to update plan.");
      toast.success("Plan updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update plan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <Select value={plan} onValueChange={(value) => setPlan(value as Plan)} disabled={isSaving}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLANS.map((option) => (
              <SelectItem key={option} value={option} className="capitalize">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subscriptionStatus">Subscription status</Label>
        <Input
          id="subscriptionStatus"
          value={subscriptionStatus}
          onChange={(event) => setSubscriptionStatus(event.target.value)}
          placeholder="active"
          className="w-40"
          disabled={isSaving}
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
