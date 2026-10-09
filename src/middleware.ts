import { NextResponse, type NextRequest } from "next/server";

// The SDKs authenticate with a bearer header, never a cookie, so credentials stay off: a
// wildcard origin with credentials would let any site ride along on a signed-in session.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Device-Id, X-Fewchurs-Sdk, Accept-Language",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const response = NextResponse.next();
  for (const [header, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(header, value);
  }
  return response;
}

export const config = {
  matcher: "/api/v1/:path*",
};
