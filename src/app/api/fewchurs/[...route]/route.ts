import { createHash } from "node:crypto";
import { createHandler } from "@fewchurs/next/handler";
import { createDeviceId, readDeviceId } from "@fewchurs/next/identity";
import { getSessionUser } from "@/lib/auth/requireUser";

export const { GET, POST, DELETE } = createHandler({
  deviceId: async () => {
    const user = await getSessionUser();
    if (!user) return (await readDeviceId()) ?? createDeviceId();
    return createHash("sha256").update(`fewchurs-site:${user.uid}`).digest("hex");
  },
});
