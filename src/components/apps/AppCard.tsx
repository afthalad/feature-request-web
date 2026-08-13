import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { App } from "@/types";

export function AppCard({ app }: { app: App }) {
  return (
    <Link href={`/dashboard/apps/${app.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{app.name}</CardTitle>
          <CardDescription>{app.bundleId}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {app.featureCount} feature request{app.featureCount === 1 ? "" : "s"}
        </CardContent>
      </Card>
    </Link>
  );
}
