"use client";

import { useState } from "react";
import { RegenerateKeyDialog } from "@/components/apps/RegenerateKeyDialog";
import { ApiKeyDialog } from "@/components/apps/ApiKeyDialog";

interface ApiKeySectionProps {
  appId: string;
  apiKeyPrefix: string;
}

export function ApiKeySection({ appId, apiKeyPrefix }: ApiKeySectionProps) {
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <code className="bg-surface text-muted-foreground flex h-10 min-w-0 flex-1 items-center rounded-lg px-3 text-sm">
        {apiKeyPrefix}...
      </code>
      <RegenerateKeyDialog appId={appId} onRegenerated={setNewApiKey} />
      <ApiKeyDialog apiKey={newApiKey} onClose={() => setNewApiKey(null)} />
    </div>
  );
}
