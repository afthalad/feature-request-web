import { createHash } from "node:crypto";
import { createHandler } from "@fewchurs/next/handler";
import { createDeviceId, readDeviceId } from "@fewchurs/next/identity";
import { getSessionUser } from "@/lib/auth/requireUser";

const { GET: get, POST: post, DELETE: del } = createHandler({
  // Votes follow the signed-in account, so they survive a new browser or device.
  deviceId: async () => {
    const user = await getSessionUser();
    if (!user) return (await readDeviceId()) ?? createDeviceId();
    return createHash("sha256").update(`fewchurs-site:${user.uid}`).digest("hex");
  },
});

// Only signed-in dashboard users get the feedback button, so the proxy refuses everyone else
// instead of letting anyone spend this site's Fewchurs quota through it.
async function signedInOnly(
  handler: typeof get,
  ...args: Parameters<typeof get>
): Promise<Response> {
  if (!(await getSessionUser())) {
    return Response.json({ error: { code: "unauthorized", message: "Sign in to send feedback." } }, { status: 401 });
  }
  return handler(...args);
}

export const GET: typeof get = (...args) => signedInOnly(get, ...args);
export const POST: typeof post = (...args) => signedInOnly(post, ...args);
export const DELETE: typeof del = (...args) => signedInOnly(del, ...args);
