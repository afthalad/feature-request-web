import {
  siSwift,
  siFlutter,
  siNextdotjs,
  siKotlin,
  siReact,
  siLaravel,
} from "simple-icons";

export interface Platform {
  id: string;
  name: string;
  tagline: string;
  iconPath: string;
  iconColor: string;
  href?: string;
  deviceType?: "mobile" | "web";
  codeSnippet?: {
    filename: string;
    code: string;
  };
}

export const PLATFORMS: Platform[] = [
  {
    id: "swiftui",
    name: "SwiftUI",
    tagline: "A native board view, dropped into any SwiftUI app.",
    iconPath: siSwift.path,
    iconColor: `#${siSwift.hex}`,
    href: "/docs/swiftui",
    deviceType: "mobile",
    codeSnippet: {
      filename: "ContentView.swift",
      code: `import Fewchurs

Fewchurs.configure(apiKey: "fr_live_xxx")
Fewchurs.showBoard()`,
    },
  },
  {
    id: "flutter",
    name: "Flutter",
    tagline: "One package for iOS, Android and the web.",
    iconPath: siFlutter.path,
    iconColor: `#${siFlutter.hex}`,
    href: "/docs/flutter",
    deviceType: "mobile",
  },
  {
    id: "nextjs",
    name: "Next.js",
    tagline:
      "A floating button that opens your board in a sheet. Your key stays on the server.",
    iconPath: siNextdotjs.path,
    iconColor: `#${siNextdotjs.hex}`,
    href: "/docs/nextjs",
    deviceType: "web",
    codeSnippet: {
      filename: "app/layout.tsx",
      code: `import { FewchursButton } from "@fewchurs/next";

// in your root layout, after {children}
<FewchursButton floating />`,
    },
  },
  {
    id: "kotlin",
    name: "Kotlin",
    tagline: "Add the board to your Android app with Kotlin.",
    iconPath: siKotlin.path,
    iconColor: `#${siKotlin.hex}`,
    href: "/docs/kotlin",
    deviceType: "mobile",
    codeSnippet: {
      filename: "MainActivity.kt",
      code: `import com.fewchurs.sdk.Fewchurs
import com.fewchurs.sdk.ui.FewchursBoard

Fewchurs.configure(this, apiKey = "fr_live_xxx")
FewchursBoard()`,
    },
  },
  {
    id: "react",
    name: "React",
    tagline: "A floating button that opens your board in a sheet, for any React app.",
    iconPath: siReact.path,
    iconColor: `#${siReact.hex}`,
    href: "/docs/react",
    deviceType: "web",
    codeSnippet: {
      filename: "App.tsx",
      code: `import { FewchursButton, FewchursProvider } from "@fewchurs/react";

<FewchursProvider apiKey="fr_live_xxx">
  <FewchursButton floating />
</FewchursProvider>`,
    },
  },
  {
    id: "laravel",
    name: "Laravel",
    tagline: "A server-side board. Your key stays on the server.",
    iconPath: siLaravel.path,
    iconColor: `#${siLaravel.hex}`,
    href: "/docs/laravel",
    deviceType: "web",
    codeSnippet: {
      filename: "feedback.blade.php",
      code: `{{-- composer require fewchurs/laravel --}}
{{-- .env: FEWCHURS_API_KEY=fr_live_xxx --}}

<x-fewchurs::board />`,
    },
  },
];
