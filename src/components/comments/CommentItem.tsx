import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types";

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const initial = (comment.authorName || "?").charAt(0).toUpperCase();

  return (
    <div className="group/comment flex items-start gap-2.5 py-2.5">
      <Avatar size="sm">
        <AvatarFallback
          className={cn(comment.isDeveloper && "bg-primary/10 text-primary")}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{comment.authorName}</span>
          {comment.isDeveloper && (
            <Badge className="bg-primary/10 text-primary">Developer</Badge>
          )}
          <span className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="bg-muted w-fit max-w-full rounded-lg px-3 py-1.5 text-sm break-words whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(comment.id)}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 />
          <span className="sr-only">Delete comment</span>
        </Button>
      )}
    </div>
  );
}
