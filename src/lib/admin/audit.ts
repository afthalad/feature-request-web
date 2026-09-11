import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminAuditLogEntry } from "@/types";

interface LogAdminActionParams {
  adminUid: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
}

export async function logAdminAction({
  adminUid,
  action,
  targetType,
  targetId,
  before,
  after,
}: LogAdminActionParams): Promise<void> {
  await adminDb.collection("adminAuditLog").add({
    adminUid,
    action,
    targetType,
    targetId,
    before: before ?? null,
    after: after ?? null,
    at: FieldValue.serverTimestamp(),
  });
}

export async function listAuditLogForTarget(
  targetType: string,
  targetId: string
): Promise<AdminAuditLogEntry[]> {
  const snapshot = await adminDb
    .collection("adminAuditLog")
    .where("targetType", "==", targetType)
    .where("targetId", "==", targetId)
    .orderBy("at", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      adminUid: data.adminUid,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      before: data.before,
      after: data.after,
      at: data.at.toDate().toISOString(),
    };
  });
}
