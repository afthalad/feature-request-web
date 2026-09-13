import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromAuthHeader } from "@/lib/auth/requireUser";
import { exportFeaturesForApp } from "@/lib/features/service";
import { errorResponse } from "@/lib/api/response";
import type { Feature } from "@/types";

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, year: 365 };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return errorResponse("unauthorized", "Sign in required.");

  const { appId } = await params;
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return errorResponse("not_found", "App not found.");

  const appData = appSnap.data()!;
  if (appData.ownerUid !== user.uid) {
    return errorResponse("forbidden", "You do not own this app.");
  }

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const plan = userSnap.data()?.plan;
  if (plan !== "pro") {
    return errorResponse(
      "limit_reached",
      "CSV export is a Pro feature. Upgrade to export your feature requests."
    );
  }

  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get("period") ?? "month";
  const days = PERIOD_DAYS[periodParam] ?? PERIOD_DAYS.month;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const features = await exportFeaturesForApp({ appId, since });
  const csv = toCsv(features);
  const filename = `${appData.slug || appId}-${periodParam}-report.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function toCsv(features: Feature[]): string {
  const header = [
    "Title",
    "Description",
    "Status",
    "Upvotes",
    "Comments",
    "Followers",
    "Subscriber",
    "Created At",
  ];
  const rows = features.map((feature) => [
    feature.title,
    feature.description,
    feature.status,
    String(feature.upvoteCount),
    String(feature.commentCount),
    String(feature.followerCount),
    feature.authorIsSubscriber ? "Yes" : "No",
    feature.createdAt,
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
