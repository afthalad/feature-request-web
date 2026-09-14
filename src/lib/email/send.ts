import "server-only";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase/admin";
import { getFollowerEmails } from "@/lib/followers/service";
import { filterUnsubscribed, unsubscribeUrl } from "@/lib/email/unsubscribe";
import { trackEmailsSent, PLAN_LIMITS } from "@/lib/plans/limits";
import { escapeHtml } from "@/lib/email/escapeHtml";
import {
  newFeatureRequestEmailFull,
  newFeatureRequestEmailLimitReached,
} from "@/lib/email/templates";
import type { FeatureStatus, Plan } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const MAX_EMAILS_PER_APP_PER_DAY = 20;
const BATCH_THRESHOLD = 20;

const STATUS_LABEL: Record<FeatureStatus, string> = {
  open: "Pending",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  declined: "Declined",
};

interface NewFeatureRequestEmailParams {
  appId: string;
  title: string;
  description: string;
  upvoteCount: number;
  submitterEmail?: string;
}

export async function sendNewFeatureRequestEmail(params: NewFeatureRequestEmailParams) {
  const appRef = adminDb.collection("apps").doc(params.appId);
  const today = new Date().toISOString().slice(0, 10);

  const recipient = await adminDb.runTransaction(async (tx) => {
    const appSnap = await tx.get(appRef);
    if (!appSnap.exists) return null;

    const app = appSnap.data()!;
    if (!app.emailOnNewRequest || !app.notificationEmail) return null;

    const emailsSentToday = app.emailsSentDay === today ? app.emailsSentCount : 0;
    if (emailsSentToday >= MAX_EMAILS_PER_APP_PER_DAY) return null;

    tx.set(appRef, { emailsSentDay: today, emailsSentCount: emailsSentToday + 1 }, { merge: true });

    return {
      name: app.name as string,
      notificationEmail: app.notificationEmail as string,
      ownerUid: app.ownerUid as string,
    };
  });

  if (!recipient) return;

  const ownerSnap = await adminDb.collection("users").doc(recipient.ownerUid).get();
  const ownerPlan = ownerSnap.data()?.plan;
  const plan: Plan = ownerPlan === "pro" || ownerPlan === "starter" ? ownerPlan : "free";

  // Same limit the dashboard's "Pending" tab enforces (PLAN_LIMITS.maxFeaturesPerApp) — once an
  // app has collected more pending requests than its plan shows, new notification emails switch
  // to the masked/limit-reached version instead of the full one.
  const visibleLimit = PLAN_LIMITS[plan].maxFeaturesPerApp;
  let isOverLimit = false;
  if (Number.isFinite(visibleLimit)) {
    const pendingCountSnap = await appRef.collection("features").where("status", "==", "open").count().get();
    isOverLimit = pendingCountSnap.data().count > visibleLimit;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const emailContent = {
    appName: recipient.name,
    title: params.title,
    description: params.description,
    upvoteCount: params.upvoteCount,
    submitterEmail: params.submitterEmail,
    dashboardUrl: `${appUrl}/dashboard/apps/${params.appId}`,
    pricingUrl: `${appUrl}/pricing`,
  };

  // resend.emails.send() resolves with { error } on an API-level rejection — it does NOT throw —
  // so this must be checked explicitly, or a rejected send (e.g. a sandbox-domain restriction)
  // silently looks like success.
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: recipient.notificationEmail,
    subject: `New feature request for ${recipient.name}`,
    html: isOverLimit
      ? newFeatureRequestEmailLimitReached(emailContent)
      : newFeatureRequestEmailFull(emailContent),
  });

  if (error) {
    console.error("Failed to send new-feature-request email:", error);
    return;
  }

  await trackEmailsSent(recipient.ownerUid, 1);
}

interface StatusChangeEmailParams {
  appId: string;
  featureId: string;
  featureTitle: string;
  status: FeatureStatus;
}

export async function sendStatusChangeEmails({
  appId,
  featureId,
  featureTitle,
  status,
}: StatusChangeEmailParams) {
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return;
  const appName = appSnap.data()!.name as string;
  const ownerUid = appSnap.data()!.ownerUid as string;

  const allEmails = await getFollowerEmails(appId, featureId);
  const emails = await filterUnsubscribed(allEmails);
  if (emails.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const buildHtml = (email: string) => `
    <p>An update on <strong>${escapeHtml(appName)}</strong>:</p>
    <p><strong>${escapeHtml(featureTitle)}</strong> is now <strong>${STATUS_LABEL[status]}</strong>.</p>
    <p><a href="${appUrl}/b/${appSnap.data()!.slug}">View the board</a></p>
    <p style="color:#888;font-size:12px;margin-top:24px;">
      <a href="${unsubscribeUrl(email)}">Unsubscribe</a> from status updates.
    </p>
  `;
  const subject = `${appName}: ${featureTitle} is now ${STATUS_LABEL[status]}`;

  let sentCount = 0;

  if (emails.length > BATCH_THRESHOLD) {
    const { data, error } = await resend.batch.send(
      emails.map((email) => ({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject,
        html: buildHtml(email),
      }))
    );
    if (error) {
      console.error("Failed to send batch status-change emails:", error);
    } else {
      sentCount = data?.data?.length ?? emails.length;
    }
  } else {
    const results = await Promise.all(
      emails.map((email) =>
        resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject,
          html: buildHtml(email),
        })
      )
    );
    const failed = results.filter((result) => result.error);
    if (failed.length > 0) {
      console.error(
        `Failed to send ${failed.length}/${emails.length} status-change email(s):`,
        failed[0].error
      );
    }
    sentCount = results.length - failed.length;
  }

  if (sentCount > 0) {
    await trackEmailsSent(ownerUid, sentCount);
  }
}

// Lets an app owner verify their notification email is actually reachable, surfacing the real
// provider error (e.g. Resend's sandbox-sender restriction) instead of a silent no-op.
export async function sendTestEmail(appId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const appSnap = await adminDb.collection("apps").doc(appId).get();
  if (!appSnap.exists) return { ok: false, message: "App not found." };

  const app = appSnap.data()!;
  if (!app.notificationEmail) {
    return { ok: false, message: "Set a notification email first." };
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: app.notificationEmail,
    subject: `Test email for ${app.name}`,
    html: `
      <p>This is a test email from Fewchurs for <strong>${escapeHtml(app.name as string)}</strong>.</p>
      <p>If you received this, notification emails are set up correctly.</p>
    `,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
