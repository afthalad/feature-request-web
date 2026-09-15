import "server-only";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase/admin";
import { getFollowerEmails } from "@/lib/followers/service";
import { filterUnsubscribed, unsubscribeUrl } from "@/lib/email/unsubscribe";
import { trackEmailsSent, PLAN_LIMITS } from "@/lib/plans/limits";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { maskText } from "@/lib/email/mask";
import type { FeatureStatus, Plan } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const BATCH_THRESHOLD = 20;

const NEW_FEATURE_FULL_TEMPLATE_ID = process.env.RESEND_TEMPLATE_NEW_FEATURE_FULL!;
const NEW_FEATURE_LIMIT_TEMPLATE_ID = process.env.RESEND_TEMPLATE_NEW_FEATURE_LIMIT!;
const STATUS_UPDATE_TEMPLATE_ID = process.env.RESEND_TEMPLATE_STATUS_UPDATE!;

const STATUS_LABEL: Record<FeatureStatus, string> = {
  open: "Pending",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  declined: "Declined",
};

const STATUS_COLOR: Record<FeatureStatus, string> = {
  open: "#71717a",
  planned: "#3b82f6",
  in_progress: "#f97316",
  done: "#16a34a",
  declined: "#71717a",
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
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    console.log(`[email] skipped new-feature-request email: app ${params.appId} not found`);
    return;
  }

  const app = appSnap.data()!;
  if (!app.emailOnNewRequest || !app.notificationEmail) {
    console.log(
      `[email] skipped new-feature-request email for app ${params.appId}: emailOnNewRequest=${!!app.emailOnNewRequest} notificationEmail=${!!app.notificationEmail}`
    );
    return;
  }

  const recipient = {
    name: app.name as string,
    notificationEmail: app.notificationEmail as string,
    ownerUid: app.ownerUid as string,
  };

  const ownerSnap = await adminDb.collection("users").doc(recipient.ownerUid).get();
  const ownerPlan = ownerSnap.data()?.plan;
  const plan: Plan = ownerPlan === "pro" || ownerPlan === "starter" ? ownerPlan : "free";

  // Same limit the dashboard's "Pending" tab enforces (PLAN_LIMITS.maxFeaturesPerApp) — once an
  // app has collected more pending requests than its plan shows, new notification emails switch
  // to the masked/limit-reached Resend template instead of the full one.
  const visibleLimit = PLAN_LIMITS[plan].maxFeaturesPerApp;
  let isOverLimit = false;
  if (Number.isFinite(visibleLimit)) {
    const pendingCountSnap = await appRef.collection("features").where("status", "==", "open").count().get();
    isOverLimit = pendingCountSnap.data().count > visibleLimit;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const subject = `New feature request for ${recipient.name}`;

  // resend.emails.send() resolves with { error } on an API-level rejection — it does NOT throw —
  // so this must be checked explicitly, or a rejected send (e.g. a sandbox-domain restriction)
  // silently looks like success. Subject is passed explicitly here (rather than relying on the
  // template's own Subject field in the Resend dashboard) so a blank/misconfigured template
  // subject can't silently break sending.
  const { error } = isOverLimit
    ? await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: recipient.notificationEmail,
        subject,
        template: {
          id: NEW_FEATURE_LIMIT_TEMPLATE_ID,
          variables: {
            APP_NAME: recipient.name,
            MASKED_TITLE: maskText(escapeHtml(params.title)),
            PRICING_URL: `${appUrl}/pricing`,
          },
        },
      })
    : await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: recipient.notificationEmail,
        subject,
        template: {
          id: NEW_FEATURE_FULL_TEMPLATE_ID,
          variables: {
            APP_NAME: recipient.name,
            TITLE: escapeHtml(params.title),
            DESCRIPTION_HTML: params.description
              ? `<p style="font-size: 14px; line-height: 1.6; color: #71717a; margin: 8px 0 0; white-space: pre-wrap;">${escapeHtml(params.description)}</p>`
              : "",
            UPVOTE_COUNT: String(params.upvoteCount),
            SUBMITTER_LINE: params.submitterEmail
              ? `Submitted by <a href="mailto:${escapeHtml(params.submitterEmail)}" style="color: #18181b; text-decoration: underline;">${escapeHtml(params.submitterEmail)}</a>`
              : "Submitted anonymously",
            DASHBOARD_URL: `${appUrl}/dashboard/apps/${params.appId}`,
          },
        },
      });

  if (error) {
    console.error(`[email] Resend rejected new-feature-request email for app ${params.appId}:`, error);
    return;
  }

  console.log(`[email] sent new-feature-request email for app ${params.appId} to ${recipient.notificationEmail}`);
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
  const boardUrl = `${appUrl}/b/${appSnap.data()!.slug}`;
  const buildVariables = (email: string) => ({
    APP_NAME: escapeHtml(appName),
    FEATURE_TITLE: escapeHtml(featureTitle),
    STATUS_LABEL: STATUS_LABEL[status],
    STATUS_COLOR: STATUS_COLOR[status],
    BOARD_URL: boardUrl,
    UNSUBSCRIBE_URL: unsubscribeUrl(email),
  });
  const subject = `${appName}: ${featureTitle} is now ${STATUS_LABEL[status]}`;

  console.log(`[email] queuing status-change email (${status}) for app ${appId}, feature ${featureId}, ${emails.length} recipient(s)`);

  let sentCount = 0;

  if (emails.length > BATCH_THRESHOLD) {
    const { data, error } = await resend.batch.send(
      emails.map((email) => ({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject,
        template: {
          id: STATUS_UPDATE_TEMPLATE_ID,
          variables: buildVariables(email),
        },
      }))
    );
    if (error) {
      console.error(`[email] Resend rejected batch status-change emails for app ${appId}:`, error);
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
          template: {
            id: STATUS_UPDATE_TEMPLATE_ID,
            variables: buildVariables(email),
          },
        })
      )
    );
    const failed = results.filter((result) => result.error);
    if (failed.length > 0) {
      console.error(
        `[email] Resend rejected ${failed.length}/${emails.length} status-change email(s) for app ${appId}:`,
        failed[0].error
      );
    }
    sentCount = results.length - failed.length;
  }

  console.log(`[email] status-change email settled for app ${appId}, feature ${featureId}: ${sentCount}/${emails.length} sent`);

  if (sentCount > 0) {
    await trackEmailsSent(ownerUid, sentCount);
  }
}
