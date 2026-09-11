import { listApiKeys } from "@/lib/admin/apiKeys";
import { ApiKeyList } from "@/components/admin/ApiKeyList";

export default async function AdminApiKeysPage() {
  const { keys, nextCursor } = await listApiKeys({ limit: 20, cursor: null });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">API Keys</h1>
      <ApiKeyList initialKeys={keys} initialCursor={nextCursor} />
    </div>
  );
}
