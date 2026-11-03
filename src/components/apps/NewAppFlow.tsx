"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateAppForm } from "@/components/apps/CreateAppForm";
import { ApiKeyDialog } from "@/components/apps/ApiKeyDialog";

export function NewAppFlow({ maxPlatforms }: { maxPlatforms: number }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);

  function handleClose() {
    setApiKey(null);
    router.push("/dashboard");
    // The sidebar's app list lives in the dashboard layout; refresh it to show the new app.
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">New app</h1>
        <p className="text-muted-foreground text-sm">
          Create an app to get an API key for your app or website.
        </p>
      </div>
      <CreateAppForm onCreated={setApiKey} maxPlatforms={maxPlatforms} />
      <ApiKeyDialog apiKey={apiKey} onClose={handleClose} />
    </div>
  );
}
