import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { resolveAppBySlug } from "@/lib/slug";
import { listFeaturesForApp } from "@/lib/features/service";
import { PublicBoard } from "@/components/public/PublicBoard";

const FEATURES_PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) return { title: "Board not found" };

  return {
    title: `${app.name} — Feature requests`,
    description: `See and vote on feature requests for ${app.name}.`,
  };
}

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await resolveAppBySlug(slug);
  if (!app) notFound();

  // No real device id exists yet on the server, so votes/follows render as false here — the
  // client refetches this same first page once it has a device id to correct that. The
  // placeholder id below is never a real device, so it just never matches a vote/follow doc.
  const { features: rawInitialFeatures, nextCursor: initialCursor } = await listFeaturesForApp({
    appId: app.id,
    deviceId: "ssr-render-placeholder",
    sort: "new",
    limit: FEATURES_PAGE_SIZE,
    cursor: null,
  });
  const initialFeatures = app.hideVoteCounts
    ? rawInitialFeatures.map((feature) => ({ ...feature, upvoteCount: 0 }))
    : rawInitialFeatures;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-semibold">{app.name}</h1>
        <PublicBoard
          slug={slug}
          initialFeatures={initialFeatures}
          initialCursor={initialCursor}
          hideVoteCounts={app.hideVoteCounts}
        />
      </div>
      <footer className="mt-10 border-t pt-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <Link href="/" className="underline underline-offset-2">
          Fewchurs
        </Link>
      </footer>
    </div>
  );
}
