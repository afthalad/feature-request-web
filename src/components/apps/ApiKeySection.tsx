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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">API key</p>
        <code className="text-muted-foreground text-sm">{apiKeyPrefix}...</code>
      </div>
      <RegenerateKeyDialog appId={appId} onRegenerated={setNewApiKey} />
      <ApiKeyDialog apiKey={newApiKey} onClose={() => setNewApiKey(null)} />
    </div>
  );
}
