import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/date";
import type { Follower } from "@/types";

export function FollowerItem({ follower }: { follower: Follower }) {
  const initial = follower.email.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <Avatar size="sm">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{follower.email}</p>
        <p className="text-muted-foreground text-xs">Following since {formatDate(follower.createdAt)}</p>
      </div>
    </div>
  );
}
