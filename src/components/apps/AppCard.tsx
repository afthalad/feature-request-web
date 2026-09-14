import Link from "next/link";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { PlatformIcons } from "@/components/apps/PlatformIcons";
import type { App } from "@/types";

export function AppCard({ app }: { app: App }) {
  return (
    <Link href={`/dashboard/apps/${app.id}`} className="block">
      <Item variant="muted" className="transition-colors hover:bg-muted/80">
        <ItemContent>
          <ItemTitle className="flex items-center gap-2">
            {app.name}
            <PlatformIcons platforms={app.platforms} />
          </ItemTitle>
          <ItemDescription>{app.bundleId}</ItemDescription>
        </ItemContent>

        <div className="text-muted-foreground text-sm">
          {app.featureCount} feature request
          {app.featureCount === 1 ? "" : "s"}
        </div>
      </Item>
    </Link>
  );
}
