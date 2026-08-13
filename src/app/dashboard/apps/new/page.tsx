"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateAppForm } from "@/components/apps/CreateAppForm";
import { ApiKeyDialog } from "@/components/apps/ApiKeyDialog";

export default function NewAppPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);

  function handleClose() {
    setApiKey(null);
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">New app</h1>
        <p className="text-muted-foreground text-sm">
          Create an app to get an API key for your iOS SDK.
        </p>
      </div>
      <CreateAppForm onCreated={setApiKey} />
      <ApiKeyDialog apiKey={apiKey} onClose={handleClose} />
    </div>
  );
}
