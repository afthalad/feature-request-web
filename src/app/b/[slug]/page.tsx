import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { resolveAppBySlug } from "@/lib/slug";
import { PublicBoard } from "@/components/public/PublicBoard";
import type { FeatureWithVote } from "@/types";

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

  const featuresSnapshot = await adminDb
    .collection("apps")
    .doc(app.id)
    .collection("features")
    .get();

  const initialFeatures: FeatureWithVote[] = featuresSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description ?? "",
      status: data.status,
      upvoteCount: data.upvoteCount,
      commentCount: data.commentCount ?? 0,
      followerCount: data.followerCount ?? 0,
      authorDeviceId: data.authorDeviceId,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      hasVoted: false,
      isFollowing: false,
    };
  });

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-semibold">{app.name}</h1>
        <PublicBoard slug={slug} initialFeatures={initialFeatures} />
      </div>
      <footer className="mt-10 border-t pt-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <Link href="/" className="underline underline-offset-2">
          Feature Request
        </Link>
      </footer>
    </div>
  );
}
