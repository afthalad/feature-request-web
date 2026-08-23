export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2">
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
      </div>
      <pre className="overflow-x-auto bg-foreground p-4 text-xs whitespace-pre text-background">
        <code>{code}</code>
      </pre>
    </div>
  );
}
