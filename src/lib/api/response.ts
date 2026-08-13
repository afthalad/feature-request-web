import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/types";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  invalid_key: 401,
  missing_device_id: 400,
  validation_failed: 400,
  rate_limited: 429,
  not_found: 404,
  internal: 500,
  unauthorized: 401,
  forbidden: 403,
  limit_reached: 402,
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(code: ApiErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS_BY_CODE[code] });
}
