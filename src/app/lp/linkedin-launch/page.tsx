import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { Halftone } from "@/components/landing-v2/Halftone";
import { jakarta } from "@/components/landing-v2/fonts";
import { PLATFORMS } from "@/lib/platforms";
import "@/components/landing-v2/v2.css";

export const metadata: Metadata = {
  title: "Ship what your users actually want",
  description:
    "Add a feature request board to your iOS, Android or web app in minutes. Users suggest and vote, you get a ranked roadmap. Free, no credit card.",
  robots: { index: false, follow: false },
};

const SIGN_UP_HREF = "/login?from=linkedin-launch";

const BENEFITS = [
  "Users suggest and vote on features from inside your app",
  "A ranked roadmap instead of scattered emails, reviews and DMs",
  "Followers get an email when you ship what they asked for",
];

const STEPS = [
  { title: "Create an app", body: "Sign in with Google and get your API key." },
  { title: "Add the SDK", body: "A few lines of code. About five minutes." },
  { title: "Build what wins", body: "See the most-voted requests and ship them." },
];

function iconFill(color: string) {
  return color.toLowerCase() === "#000000" ? undefined : color;
}

function SignUpButton() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href={SIGN_UP_HREF}
        className={buttonVariants({
          size: "lg",
          className: "h-13 w-full max-w-xs rounded-xl px-7 text-base font-bold sm:w-auto",
        })}
      >
        Start free
        <ArrowRight className="size-4" />
      </Link>
      <p className="text-sm text-[var(--v2-fg-3)]">Free forever for one app. No credit card.</p>
    </div>
  );
}

export default function LinkedInLaunchPage() {
  return (
    <div className={`${jakarta.variable} v2-root flex min-h-dvh flex-1 flex-col overflow-x-clip`}>
      <main className="relative isolate flex-1 px-5 pt-8 pb-16 sm:px-8 sm:pt-12">
        <Halftone mode="corners" className="-z-10 h-[560px]" />
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.03em]">
            <Image src="/logo-mark.svg" alt="Fewchurs" width={28} height={28} priority className="size-7" />
            <span aria-hidden>fewchurs</span>
          </span>

          <h1 className="mt-10 text-[2.4rem] leading-[1.06] tracking-[-0.04em] text-balance sm:text-6xl">
            Ship what your users actually want.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-balance text-[var(--v2-fg-2)] sm:text-lg">
            Add a feature request board to your iOS, Android or web app in minutes. Your users vote, you build what
            wins.
          </p>

          <div className="mt-8 w-full">
            <SignUpButton />
          </div>

          <ul className="mt-12 w-full space-y-3 text-left">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 rounded-2xl bg-[var(--v2-card)] p-4 shadow-[var(--v2-shadow)]"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--v2-orange)] text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="font-semibold">{benefit}</span>
              </li>
            ))}
          </ul>

          <section className="mt-14 w-full">
            <h2 className="font-mono text-xs tracking-[0.14em] text-[var(--v2-fg-3)] uppercase">
              Native SDKs for your stack
            </h2>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {PLATFORMS.map((platform) => (
                <li key={platform.id} className="flex items-center gap-2 text-sm font-semibold text-[var(--v2-fg-2)]">
                  <BrandIcon path={platform.iconPath} color={iconFill(platform.iconColor)} className="size-5" />
                  {platform.name}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[var(--v2-fg-3)]">
              Featured on <span className="font-semibold text-[var(--v2-fg-2)]">Product Hunt</span>
            </p>
          </section>

          <section className="mt-14 w-full">
            <h2 className="text-3xl leading-[1.1] tracking-[-0.035em]">Live in three steps.</h2>
            <ol className="mt-6 grid gap-3 text-left sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-[var(--v2-card)] p-5 shadow-[var(--v2-shadow)]">
                  <span className="font-mono text-xs font-bold text-[var(--v2-orange)]">0{index + 1}</span>
                  <p className="mt-2 font-bold">{step.title}</p>
                  <p className="mt-1 text-sm text-[var(--v2-fg-3)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-14 w-full">
            <SignUpButton />
          </div>
        </div>
      </main>
    </div>
  );
}
