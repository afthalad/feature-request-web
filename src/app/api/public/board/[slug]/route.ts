import { NextRequest } from "next/server";
import { resolveAppBySlug } from "@/lib/slug";
import { ok, errorResponse } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return errorResponse("not_found", "Board not found.");

  return ok({ name: app.name, slug: app.slug });
}
