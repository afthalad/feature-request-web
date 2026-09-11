import { UnsubscribeLookup } from "@/components/admin/UnsubscribeLookup";

export default function AdminUnsubscribesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Unsubscribes</h1>
      <p className="text-muted-foreground text-sm">
        Unsubscribed emails are stored as one-way hashes, so there&apos;s no full list — look up
        one address at a time.
      </p>
      <UnsubscribeLookup />
    </div>
  );
}
