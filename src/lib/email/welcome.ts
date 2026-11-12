import "server-only";
import { Resend } from "resend";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { isUnsubscribed } from "@/lib/email/unsubscribe";
import { sendServerError, sendServerEvent } from "@/lib/analytics/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// Brand orange (the --primary colour in globals.css, as hex for email clients).
const BRAND = "#ed5f18";

/**
 * Who the welcome email comes from. A person's name gets more opens and replies than
 * "notifications@", so set WELCOME_EMAIL_FROM to e.g. "Alex from Fewchurs <alex@fewchurs.com>"
 * (the domain must be verified in Resend) and WELCOME_EMAIL_SIGNATURE to the name to sign with.
 */
const FROM = process.env.WELCOME_EMAIL_FROM || `Fewchurs <${process.env.EMAIL_FROM}>`;
const REPLY_TO = process.env.WELCOME_EMAIL_REPLY_TO || undefined;
const SIGNATURE = process.env.WELCOME_EMAIL_SIGNATURE || "The Fewchurs team";
// Signed by a person, the P.S. speaks for them; signed by the team, it says "we".
const PS = process.env.WELCOME_EMAIL_SIGNATURE
  ? "P.S. Hit reply and tell me what you're building. I read every email."
  : "P.S. Hit reply and tell us what you're building. We read every email.";

interface WelcomeEmailParams {
  uid: string;
  email: string;
  displayName?: string;
}

/**
 * Sends the welcome email to a new account, once. Never throws: a failed send is logged and
 * reported to PostHog Error tracking, and must not break sign-in.
 */
export async function sendWelcomeEmail({ uid, email, displayName }: WelcomeEmailParams) {
  try {
    if (!email) return;
    if (await isUnsubscribed(email)) {
      console.log(`[email] skipped welcome email for ${uid}: unsubscribed`);
      return;
    }

    const userRef = adminDb.collection("users").doc(uid);
    if ((await userRef.get()).data()?.welcomeEmailSentAt) return;

    const firstName = (displayName ?? "").trim().split(/\s+/)[0] || "there";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.fewchurs.com";

    const { error } = await resend.emails.send(
      {
        from: FROM,
        to: email,
        replyTo: REPLY_TO,
        subject: "You just joined the 10%",
        html: welcomeHtml({ firstName, appUrl }),
        text: welcomeText({ firstName, appUrl }),
        tags: [{ name: "category", value: "welcome" }],
      },
      // Resend drops a repeat with the same key (for 24 hours), so two sign-ins racing each
      // other can't send it twice.
      { idempotencyKey: `welcome/${uid}` }
    );
    if (error) throw new Error(`Resend rejected the welcome email: ${error.message}`);

    await userRef.set({ welcomeEmailSentAt: FieldValue.serverTimestamp() }, { merge: true });
    await sendServerEvent(uid, "welcome_email_sent");
    console.log(`[email] sent welcome email to ${uid}`);
  } catch (error) {
    console.error(`[email] welcome email FAILED for ${uid}:`, error);
    await sendServerError(error, uid, { step: "welcome_email" });
  }
}

interface Content {
  firstName: string;
  appUrl: string;
}

function welcomeText({ firstName, appUrl }: Content): string {
  return `Hey ${firstName},

Here's an uncomfortable truth: most products are built on a doc, a hunch and a long list of assumptions. Teams spend months shipping features nobody asked for, then wonder why no one uses them.

The few that win do one thing differently: they build what people actually want.

By signing up for Fewchurs, you just made that choice. Congrats, you're already a step ahead.

Here's how to hear from your users today:

1. Create your app (takes 30 seconds): ${appUrl}/dashboard/apps/new
2. Add the SDK, three lines of code for iOS, Android or web: ${appUrl}/docs
3. Watch the requests roll in. Your users suggest and vote; you see what matters most.

Stop guessing. Start listening.

To building what people want,
${SIGNATURE}

${PS}
`;
}

function welcomeHtml({ firstName, appUrl }: Content): string {
  const name = escapeHtml(firstName);
  const signature = escapeHtml(SIGNATURE);
  // A PNG, because Gmail and Outlook block SVG. Served from public/email/.
  const logo = `${appUrl}/email/logo-mark.png`;
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const step = (n: number, title: string, body: string) => `
    <tr>
      <td style="padding:0 0 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #efeeec;border-radius:14px;">
          <tr>
            <td width="52" valign="top" style="padding:16px 0 16px 16px;">
              <div style="width:32px;height:32px;border-radius:10px;background:#fdeee6;color:${BRAND};font-size:15px;font-weight:800;line-height:32px;text-align:center;">${n}</div>
            </td>
            <td style="padding:16px 16px 16px 4px;font-size:14px;line-height:1.5;color:#52525b;">
              <div style="font-size:15px;font-weight:700;color:#18181b;margin-bottom:2px;">${title}</div>${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Welcome to Fewchurs</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:${font};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Most products are built on guesses. Yours won't be.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #ebeae7;">

          <!-- Hero -->
          <tr>
            <td style="background:#111113;background-image:linear-gradient(160deg,#2a160c 0%,#151314 45%,#111113 100%);padding:32px 32px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;"><img src="${logo}" width="36" height="36" alt="Fewchurs" style="display:block;border:0;width:36px;height:36px;" /></td>
                  <td style="font-size:19px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Fewchurs</td>
                </tr>
              </table>

              <div style="margin:28px 0 14px;">
                <span style="display:inline-block;background:#3a1d0e;color:#ff9a5c;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;">WELCOME TO THE 10%</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.025em;color:#ffffff;">You chose to build what people <span style="color:${BRAND};">actually want.</span></h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">Most products are built on docs, hunches and assumptions. You just picked the other path.</p>

            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;font-size:15px;line-height:1.65;color:#3f3f46;">
              <p style="margin:0 0 14px;">Hey ${name},</p>
              <p style="margin:0 0 14px;">Teams spend months shipping features nobody asked for, then wonder why no one uses them. The few that win do one thing differently: <strong style="color:#18181b;">they listen first, then build.</strong></p>
              <p style="margin:0 0 24px;">That's exactly what you just signed up for. Congrats, you're already a step ahead. 🎉</p>
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:#a1a1aa;">GET YOUR FIRST REQUEST TODAY</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${step(1, "Create your app", "Takes 30 seconds and gives you an API key.")}
                ${step(2, "Add the SDK", `Three lines of code for iOS, Android or web. <a href="${appUrl}/docs" style="color:${BRAND};text-decoration:none;font-weight:600;">Read the docs &rarr;</a>`)}
                ${step(3, "Watch the requests roll in", "Users suggest and vote. You ship what matters most.")}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 32px 8px;">
              <a href="${appUrl}/dashboard/apps/new" style="display:inline-block;background:${BRAND};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:999px;">Create your first app &rarr;</a>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:28px 32px 32px;font-size:15px;line-height:1.65;color:#3f3f46;">
              <p style="margin:0 0 4px;font-size:17px;font-weight:800;letter-spacing:-0.01em;color:#18181b;">Stop guessing. Start listening.</p>
              <p style="margin:0 0 20px;">To building what people want,<br />${signature}</p>
              <div style="background:#fdf6f1;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.55;color:#7c4a2d;">${escapeHtml(PS)}</div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
          <tr>
            <td align="center" style="padding:22px 12px 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
              <img src="${logo}" width="20" height="20" alt="" style="display:inline-block;border:0;width:20px;height:20px;vertical-align:middle;opacity:0.9;" />
              <span style="vertical-align:middle;font-weight:700;color:#71717a;margin-left:4px;">Fewchurs</span><br />
              <a href="${appUrl}/docs" style="color:#a1a1aa;text-decoration:underline;">Docs</a> &nbsp;&middot;&nbsp;
              <a href="${appUrl}/pricing" style="color:#a1a1aa;text-decoration:underline;">Pricing</a> &nbsp;&middot;&nbsp;
              <a href="${appUrl}/dashboard" style="color:#a1a1aa;text-decoration:underline;">Dashboard</a><br />
              You're getting this because you just created a Fewchurs account.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
