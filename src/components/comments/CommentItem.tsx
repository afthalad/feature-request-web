import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types";

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{comment.authorName}</span>
          {comment.isDeveloper && (
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">Developer</Badge>
          )}
        </div>
        <p className="text-muted-foreground whitespace-pre-wrap break-words">{comment.text}</p>
      </div>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(comment.id)}
          className="text-muted-foreground shrink-0"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
