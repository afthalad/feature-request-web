import Link from "next/link";
import { Inbox, TrendingUp, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

const BENEFITS = [
  { icon: Inbox, title: "Collect requests", description: "Every idea lands in one place." },
  { icon: TrendingUp, title: "See what's most wanted", description: "Votes surface the top asks." },
  { icon: Mail, title: "Email users when it ships", description: "Turns a request into a reason to come back." },
];

const CODE_SNIPPET = `import FeatureRequest

FeatureRequest.configure(apiKey: "fr_live_xxx")
FeatureRequest.showBoard()`;

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 space-y-12 px-4 py-12 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">
          Let your app&apos;s users tell you what to build next.
        </h1>
      </div>

      <PhoneMockup />

      <div className="space-y-2 text-left">
        <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs whitespace-pre-wrap break-words text-background">
          <code>{CODE_SNIPPET}</code>
        </pre>
      </div>

      <div className="space-y-5 text-left">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <Link href="/login" className={buttonVariants({ className: "w-full" })}>
        Sign in with Google
      </Link>
    </div>
  );
}
