export function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        </div>
        {filename && <span className="text-muted-foreground text-xs">{filename}</span>}
      </div>
      <pre className="bg-ink text-ink-foreground overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
