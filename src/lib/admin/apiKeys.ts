import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminApiKey } from "@/types";

interface ListApiKeysParams {
  limit: number;
  cursor: string | null;
  active?: boolean;
}

export async function listApiKeys({
  limit,
  cursor,
  active,
}: ListApiKeysParams): Promise<{ keys: AdminApiKey[]; nextCursor: string | null }> {
  const keysRef = adminDb.collection("apiKeys");
  let query = keysRef.orderBy("createdAt", "desc").limit(limit + 1);
  if (active !== undefined) query = keysRef.where("active", "==", active).orderBy("createdAt", "desc").limit(limit + 1);

  if (cursor) {
    const cursorSnap = await keysRef.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  const appIds = [...new Set(docs.map((doc) => doc.data().appId as string))];
  const appRefs = appIds.map((id) => adminDb.collection("apps").doc(id));
  const appSnaps = appRefs.length ? await adminDb.getAll(...appRefs) : [];
  const appNames = new Map(appSnaps.map((snap) => [snap.id, snap.data()?.name ?? "Unknown app"]));

  const keys: AdminApiKey[] = docs.map((doc) => {
    const data = doc.data();
    return {
      hash: doc.id,
      appId: data.appId,
      appName: appNames.get(data.appId) ?? "Unknown app",
      ownerUid: data.ownerUid,
      active: data.active,
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });

  return { keys, nextCursor };
}

export async function revokeApiKey(hash: string): Promise<void> {
  await adminDb.collection("apiKeys").doc(hash).update({ active: false });
}
