import { escapeHtml } from "@/lib/email/escapeHtml";
import { maskText } from "@/lib/email/mask";

const BRAND_COLOR = "#f97316";
const INK_COLOR = "#18181b";
const MUTED_COLOR = "#71717a";

function logoHtml(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
      <tr>
        <td style="width: 24px; height: 24px; background: ${BRAND_COLOR}; border-radius: 6px; text-align: center; vertical-align: middle; color: #ffffff; font-size: 12px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">F</td>
        <td style="padding-left: 8px; font-size: 14px; font-weight: 700; color: ${INK_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Fewchurs</td>
      </tr>
    </table>
  `;
}

function card(content: string): string {
  return `
    <div style="background: #f4f4f5; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; color: ${INK_COLOR};">
        ${logoHtml()}
        ${content}
      </div>
    </div>
  `;
}

function button(href: string, label: string, variant: "dark" | "brand" = "dark"): string {
  const background = variant === "brand" ? BRAND_COLOR : "#18181b";
  return `<a href="${href}" style="display: inline-block; background: ${background}; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">${escapeHtml(label)}</a>`;
}

export interface NewFeatureRequestEmailContent {
  appName: string;
  title: string;
  description: string;
  upvoteCount: number;
  submitterEmail?: string;
  dashboardUrl: string;
  pricingUrl: string;
}

// Full version — sent while the app is within its plan's visible-request limit.
export function newFeatureRequestEmailFull({
  title,
  description,
  upvoteCount,
  submitterEmail,
  dashboardUrl,
}: NewFeatureRequestEmailContent): string {
  const userLine = submitterEmail
    ? `Submitted by <a href="mailto:${escapeHtml(submitterEmail)}" style="color: ${INK_COLOR}; text-decoration: underline;">${escapeHtml(submitterEmail)}</a>`
    : "Submitted anonymously";

  return card(`
    <h1 style="font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 6px;">New Feature Request</h1>
    <p style="font-size: 13px; color: ${MUTED_COLOR}; margin: 0 0 20px;">${userLine}</p>
    <div style="background: #f4f4f5; border-left: 3px solid ${BRAND_COLOR}; border-radius: 6px; padding: 14px 16px; margin: 0 0 16px;">
      <p style="font-size: 15px; line-height: 1.6; color: ${INK_COLOR}; margin: 0; white-space: pre-wrap;">&quot;${escapeHtml(title)}&quot;</p>
      ${
        description
          ? `<p style="font-size: 14px; line-height: 1.6; color: ${MUTED_COLOR}; margin: 8px 0 0; white-space: pre-wrap;">${escapeHtml(description)}</p>`
          : ""
      }
    </div>
    <p style="font-size: 13px; color: ${MUTED_COLOR}; margin: 0 0 24px;">${upvoteCount} vote${upvoteCount === 1 ? "" : "s"} so far</p>
    ${button(dashboardUrl, "View in dashboard")}
  `);
}

// Limit-reached version — the app has more pending requests than its plan shows, so the
// content itself is teased (masked) rather than hidden outright, matching the dashboard banner.
export function newFeatureRequestEmailLimitReached({
  title,
  pricingUrl,
}: NewFeatureRequestEmailContent): string {
  return card(`
    <h1 style="font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 6px;">New Feature Request</h1>
    <p style="font-size: 13px; color: ${MUTED_COLOR}; margin: 0 0 20px;">User: [Hidden &mdash; limit reached]</p>
    <div style="background: #f4f4f5; border-left: 3px solid ${BRAND_COLOR}; border-radius: 6px; padding: 14px 16px; margin: 0 0 12px;">
      <p style="font-size: 15px; line-height: 1.6; color: ${INK_COLOR}; margin: 0;">&quot;${escapeHtml(maskText(title))}&quot;</p>
    </div>
    <p style="font-size: 13px; color: ${BRAND_COLOR}; font-weight: 600; margin: 0 0 24px;">Limit reached. Upgrade your plan to view feature requests.</p>
    ${button(pricingUrl, "Upgrade plan", "brand")}
  `);
}
