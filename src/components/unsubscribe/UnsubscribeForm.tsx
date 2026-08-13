"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleUnsubscribe() {
    if (!token) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (!token) {
    return <p className="text-muted-foreground text-sm">This unsubscribe link is invalid.</p>;
  }

  if (status === "done") {
    return <p className="text-sm">You&apos;ve been unsubscribed from all status update emails.</p>;
  }

  return (
    <>
      <h1 className="text-lg font-semibold">Unsubscribe</h1>
      <p className="text-muted-foreground text-sm">
        You&apos;ll stop receiving status update emails for every board.
      </p>
      <Button onClick={handleUnsubscribe} disabled={status === "loading"}>
        {status === "loading" ? "Unsubscribing..." : "Unsubscribe"}
      </Button>
      {status === "error" && <p className="text-destructive text-sm">Something went wrong. Try again.</p>}
    </>
  );
}
