import type { Instrumentation } from "next";

/**
 * Next.js calls this for every error it didn't get a response out of: route handlers, server
 * components, server actions and middleware. Each one goes to PostHog Error tracking.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // Keep the import inside this exact check: Next.js drops the block from the edge bundle, which
  // can't load posthog-node. Middleware errors on the edge runtime are skipped.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const { sendServerError } = await import("@/lib/analytics/server");
    await sendServerError(error, distinctIdFromCookie(request.headers.cookie), {
      path: request.path,
      method: request.method,
      route: context.routePath,
      route_type: context.routeType,
      render_source: "renderSource" in context ? context.renderSource : undefined,
    });
  }
};

/**
 * The browser SDK keeps the visitor's id in a `ph_<key>_posthog` cookie. Reading it ties a server
 * error to the person who hit it (signed in or not), without a database lookup.
 */
function distinctIdFromCookie(cookieHeader: string | string[] | undefined): string | undefined {
  const header = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
  if (!header) return undefined;
  const name = `ph_${process.env.NEXT_PUBLIC_POSTHOG_KEY}_posthog=`;
  const raw = header
    .split(/;\s*/)
    .find((part) => part.startsWith(name))
    ?.slice(name.length);
  if (!raw) return undefined;
  try {
    const id = JSON.parse(decodeURIComponent(raw))?.distinct_id;
    return typeof id === "string" ? id : undefined;
  } catch {
    return undefined;
  }
}
