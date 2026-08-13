import { NextRequest } from "next/server";
import { decodeUnsubscribeToken, addUnsubscribe } from "@/lib/email/unsubscribe";
import { ok, errorResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== "string") {
    return errorResponse("validation_failed", "Missing token.");
  }

  const email = decodeUnsubscribeToken(token);
  if (!email) {
    return errorResponse("validation_failed", "Invalid unsubscribe link.");
  }

  await addUnsubscribe(email);
  return ok({ email });
}
