/**
 * Facts for the /compare pages. Every claim about another product comes from
 * its own pricing page or docs (listed in `sources`) on `checked`. Prices
 * change: re-check each source and bump `checked` before editing a row.
 */

export interface CompareRow {
  label: string;
  fewchurs: string;
  them: string;
}

export interface Competitor {
  slug: string;
  name: string;
  /** The company's own app icon, copied from its website into /public/compare. */
  logo: string;
  /** Month the facts below were last checked against the sources. */
  checked: string;
  /** One line for the index card. */
  blurb: string;
  /** <title>, kept under 60 characters with the " | Fewchurs" suffix. */
  title: string;
  description: string;
  headline: string;
  intro: string;
  /** The short answer, shown first. */
  verdict: string;
  rows: CompareRow[];
  chooseThem: string[];
  chooseUs: string[];
  faq: { q: string; a: string }[];
  sources: { label: string; href: string }[];
}

const CHECKED = "November 2026";

/** Fewchurs' side of rows every page shares. Keep in sync with PricingPlans. */
const US = {
  price: "Free for 1 app. Starter $9/mo (3 apps), Pro $24/mo (5 apps). Yearly gets 2 months free.",
  model: "Per app. No seat or tracked-user limits.",
  mobile: "Native SDKs: SwiftUI (iOS 17+), Kotlin with Jetpack Compose, Flutter.",
  web: "React, Next.js and Laravel SDKs, plus a REST API for anything else.",
  login: "None. Votes are tied to a device ID; you can pass your own user ID.",
  setup: "Add the package and one view. About five minutes.",
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "canny",
    logo: "/compare/canny.png",
    name: "Canny",
    checked: CHECKED,
    blurb: "Feedback boards for product teams, priced by tracked users. Mobile apps use a web view.",
    title: "Fewchurs vs Canny: a Canny alternative for apps",
    description:
      "Fewchurs vs Canny compared: native iOS, Android and Flutter SDKs instead of a web view, and per-app pricing from $0 instead of $79 a month.",
    headline: "Fewchurs vs Canny",
    intro:
      "Canny is a feedback tool for product teams that lives on the web. Fewchurs is a feature request board you drop inside your own app, with native SDKs for mobile and web.",
    verdict:
      "If your users live inside a mobile app, Fewchurs gives them a native board for $0 to $24 a month. If you need a full product-management suite with integrations and a large team, Canny does more.",
    rows: [
      {
        label: "Price",
        fewchurs: US.price,
        them: "Free for 25 tracked users. Pro is $79/mo billed yearly. Business is custom.",
      },
      { label: "What you pay for", fewchurs: US.model, them: "Tracked users and managers (admins)." },
      {
        label: "Inside a native iOS or Android app",
        fewchurs: US.mobile,
        them: "A web view widget that needs SSO. Canny calls it an advanced feature and suggests its full site for most cases.",
      },
      { label: "Web apps", fewchurs: US.web, them: "Hosted board site and a JavaScript widget." },
      { label: "User login to vote", fewchurs: US.login, them: "Users identify through SSO or a Canny account." },
      { label: "Setup", fewchurs: US.setup, them: "Create a board, then embed the widget or link to your Canny site." },
      {
        label: "Roadmap and changelog",
        fewchurs: "Statuses (open, planned, in progress, done) and a public board on Pro.",
        them: "Public roadmap and changelog.",
      },
      {
        label: "Integrations",
        fewchurs: "REST API. No built-in Jira or Slack sync yet.",
        them: "Many, including tools like Jira and Intercom.",
      },
    ],
    chooseThem: [
      "You run a large product team that needs roadmaps, changelogs and integrations in one place.",
      "Your feedback mostly comes from a web product, not a mobile app.",
      "You already use SSO for every user and the tracked-user pricing fits.",
    ],
    chooseUs: [
      "Your users are in an iOS, Android or Flutter app and you want a board that feels native.",
      "You want anyone to vote without signing up or setting up SSO.",
      "You have one to five apps and want a flat price instead of paying per tracked user.",
    ],
    faq: [
      {
        q: "Is Fewchurs a good Canny alternative for mobile apps?",
        a: "Yes, that's what it's built for. Fewchurs ships native SDKs for SwiftUI, Kotlin and Flutter, so the board renders as part of your app. Canny's mobile option loads its widget in a web view and needs SSO.",
      },
      {
        q: "Is Fewchurs cheaper than Canny?",
        a: "For most indie and small-team apps, yes. Fewchurs is free for one app and $9 or $24 a month after that, with no limit on users. Canny's free plan covers 25 tracked users and Pro is $79 a month billed yearly.",
      },
      {
        q: "Can I move my Canny requests to Fewchurs?",
        a: "There's no one-click import yet. You can create requests through the Fewchurs REST API, so a short script can copy them over. Email support@fewchurs.com and we'll help.",
      },
    ],
    sources: [
      { label: "Canny pricing", href: "https://canny.io/pricing" },
      { label: "Canny mobile widget docs", href: "https://developers.canny.io/install/widget/mobile" },
    ],
  },
  {
    slug: "featurebase",
    logo: "/compare/featurebase.svg",
    name: "Featurebase",
    checked: CHECKED,
    blurb: "Feedback, help center and support inbox, priced per seat. Mobile apps embed the portal in a web view.",
    title: "Fewchurs vs Featurebase: native in-app boards",
    description:
      "Fewchurs vs Featurebase compared: native mobile SDKs instead of a web view portal, and per-app pricing instead of paying for each seat.",
    headline: "Fewchurs vs Featurebase",
    intro:
      "Featurebase bundles feedback boards, a help center, surveys and a support inbox. Fewchurs does one thing: a feature request board inside your app, with native SDKs.",
    verdict:
      "If you want feedback, help docs and support in one tool, Featurebase covers more ground. If you want a native voting board inside your mobile app at a flat price, Fewchurs is simpler.",
    rows: [
      {
        label: "Price",
        fewchurs: US.price,
        them: "Free for 1 seat and 1 board. Growth $29, Professional $59, Enterprise $99 per seat a month. Yearly is 20% off.",
      },
      { label: "What you pay for", fewchurs: US.model, them: "Seats for your team. End users are unlimited." },
      {
        label: "Inside a native iOS or Android app",
        fewchurs: US.mobile,
        them: "Embed your feedback portal in a web view, with a JWT to sign users in.",
      },
      { label: "Web apps", fewchurs: US.web, them: "Hosted portal and embeddable in-app widgets." },
      { label: "User login to vote", fewchurs: US.login, them: "Users sign in to the portal or are passed in with a JWT." },
      { label: "Setup", fewchurs: US.setup, them: "Install the Featurebase script or open the portal URL in a web view." },
      {
        label: "Beyond feature requests",
        fewchurs: "Feature requests, votes, comments and status emails only.",
        them: "Help center, surveys, changelog and a support inbox.",
      },
    ],
    chooseThem: [
      "You want feedback, a help center, surveys and support chat in one product.",
      "Your team is small and per-seat pricing stays low for you.",
      "Your product is a web app, so a web portal feels at home.",
    ],
    chooseUs: [
      "Your users are in a native iOS, Android or Flutter app.",
      "You only need feature requests and votes, without a support suite around them.",
      "You'd rather pay per app than per teammate.",
    ],
    faq: [
      {
        q: "Does Featurebase have a native mobile SDK?",
        a: "Its docs recommend embedding the feedback portal in a web view, with a JWT for signed-in users. Featurebase also has its own iOS and Android apps, but those are for your team to answer support, not a board inside your app.",
      },
      {
        q: "Which is cheaper, Fewchurs or Featurebase?",
        a: "Both have a free plan. Paid Fewchurs plans are $9 or $24 a month in total. Featurebase's paid plans start at $29 per seat a month, so the gap grows with your team.",
      },
      {
        q: "Can I use Fewchurs and Featurebase together?",
        a: "Yes. Some teams keep Featurebase for help docs and support, and use Fewchurs for the in-app voting board.",
      },
    ],
    sources: [
      { label: "Featurebase pricing", href: "https://www.featurebase.app/pricing" },
      { label: "Embed Featurebase into a mobile app", href: "https://help.featurebase.app/articles/1131771-embed-featurebase-into-mobile-app" },
    ],
  },
  {
    slug: "wishkit",
    logo: "/compare/wishkit.png",
    name: "WishKit",
    checked: CHECKED,
    blurb: "A SwiftUI feature request SDK for Apple platforms. No Android or web SDK.",
    title: "Fewchurs vs WishKit: iOS, Android and web",
    description:
      "Fewchurs vs WishKit compared: both are native in-app feature request SDKs, but Fewchurs also covers Android, Flutter and the web.",
    headline: "Fewchurs vs WishKit",
    intro:
      "WishKit and Fewchurs both put a native feature request board inside your app. The difference is reach: WishKit is Apple-only, Fewchurs covers iOS, Android, Flutter and the web.",
    verdict:
      "If you only ship on Apple platforms, including macOS, watchOS or visionOS, WishKit fits well. If you ship on iOS and Android, or have a web app too, Fewchurs gives you one board across all of them.",
    rows: [
      {
        label: "Price",
        fewchurs: US.price,
        them: "Free for 1 project and 5 requests. Premium $15/mo (2 projects), Enterprise $39/mo (unlimited). Yearly gets 2 months free.",
      },
      { label: "What you pay for", fewchurs: US.model, them: "Projects and features." },
      {
        label: "Platforms",
        fewchurs: "iOS, Android, Flutter, React, Next.js, Laravel, and any language over REST.",
        them: "iOS, macOS, visionOS, watchOS and tvOS.",
      },
      { label: "Android", fewchurs: "Native Kotlin SDK with Jetpack Compose.", them: "Not supported." },
      { label: "Web", fewchurs: US.web, them: "Not supported." },
      { label: "UI framework on Apple", fewchurs: "SwiftUI, iOS 17+.", them: "SwiftUI only (UIKit apps wrap it)." },
      { label: "User login to vote", fewchurs: US.login, them: "No login needed." },
      {
        label: "Extras",
        fewchurs: "Comments, status emails, a public board on Pro.",
        them: "Comments, chat with users and App Store review replies.",
      },
    ],
    chooseThem: [
      "Your app is Apple-only and you want macOS, watchOS, tvOS or visionOS support.",
      "You also want to read and reply to App Store reviews from the same tool.",
    ],
    chooseUs: [
      "You ship the same app on iOS and Android, or with Flutter.",
      "You have a web app or a Laravel or Next.js backend too.",
      "You want one board and one dashboard for every platform.",
    ],
    faq: [
      {
        q: "Is there a WishKit alternative for Android?",
        a: "Yes. Fewchurs has a native Kotlin SDK built with Jetpack Compose, plus a Flutter package, so Android users get the same board as iOS users.",
      },
      {
        q: "Can I use one board for my iOS and Android apps?",
        a: "Yes. On Starter and Pro, an app works on every platform. Point both the SwiftUI and Kotlin SDKs at the same app and they share requests and votes.",
      },
      {
        q: "Does Fewchurs support macOS or watchOS?",
        a: "The Swift SDK is built for iPhone apps on iOS 17 and later. If you need macOS or watchOS today, WishKit supports them.",
      },
    ],
    sources: [
      { label: "WishKit pricing", href: "https://www.wishkit.io/" },
      { label: "WishKit iOS SDK on GitHub", href: "https://github.com/wishkit/wishkit-iOS" },
    ],
  },
];

export function getCompetitor(slug: string) {
  return COMPETITORS.find((c) => c.slug === slug);
}
