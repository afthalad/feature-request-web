import Link from "next/link";
import { Inbox, TrendingUp, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { PlatformPills } from "@/components/docs/PlatformPills";

const BENEFITS = [
  { icon: Inbox, title: "Collect requests", description: "Every idea lands in one place." },
  { icon: TrendingUp, title: "See what's most wanted", description: "Votes surface the top asks." },
  { icon: Mail, title: "Email users when it ships", description: "Turns a request into a reason to come back." },
];

const CODE_SNIPPET = `import Fewchurs

Fewchurs.configure(apiKey: "fr_live_xxx")
Fewchurs.showBoard()`;

export default function Home() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-md flex-1 space-y-14 px-4 py-16 text-center">
        <div className="space-y-3">
          <span className="text-primary text-xs font-semibold tracking-wide uppercase">
            Built for indie iOS apps
          </span>
          <h1 className="text-3xl font-semibold text-balance tracking-tight">
            Let your app&apos;s users tell you what to build next.
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            Drop the Fewchurs SDK into your app and turn scattered feedback into a ranked,
            shippable roadmap.
          </p>
        </div>

        <PhoneMockup />

        <div className="text-left">
          <CodeBlock code={CODE_SNIPPET} />
        </div>

        <div className="space-y-5 text-left">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="bg-accent flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="text-accent-foreground size-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-left">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Available for
          </p>
          <PlatformPills />
        </div>

        <Link href="/login" className={buttonVariants({ className: "w-full" })}>
          Sign in with Google
        </Link>
      </div>
    </>
  );
}
