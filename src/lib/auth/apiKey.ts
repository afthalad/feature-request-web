import { randomBytes, createHash } from "crypto";

const API_KEY_PREFIX = "fr_live_";

export function generateApiKey(): string {
  return API_KEY_PREFIX + randomBytes(24).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function apiKeyDisplayPrefix(key: string): string {
  return key.slice(0, 12);
}
