import { siSwift, siFlutter, siNextdotjs, siKotlin, siReact, siLaravel } from "simple-icons";

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
    tagline: "A Dart package with the same board, coming soon.",
    iconPath: siFlutter.path,
    iconColor: `#${siFlutter.hex}`,
    deviceType: "mobile",
  },
  {
    id: "nextjs",
    name: "Next.js",
    tagline: "A server-rendered board for Next.js apps, coming soon.",
    iconPath: siNextdotjs.path,
    iconColor: `#${siNextdotjs.hex}`,
    deviceType: "web",
    codeSnippet: {
      filename: "app/page.tsx",
      code: `import { FewchursBoard } from "@fewchurs/next";

export default function Page() {
  return <FewchursBoard apiKey="fr_live_xxx" />;
}`,
    },
  },
  {
    id: "kotlin",
    name: "Kotlin",
    tagline: "A Jetpack Compose board for Android, coming soon.",
    iconPath: siKotlin.path,
    iconColor: `#${siKotlin.hex}`,
    deviceType: "mobile",
    codeSnippet: {
      filename: "MainActivity.kt",
      code: `import com.fewchurs.sdk.Fewchurs

Fewchurs.configure(apiKey = "fr_live_xxx")
FewchursBoard()`,
    },
  },
  {
    id: "react",
    name: "React",
    tagline: "A drop-in React component for web apps, coming soon.",
    iconPath: siReact.path,
    iconColor: `#${siReact.hex}`,
    deviceType: "web",
  },
  {
    id: "laravel",
    name: "Laravel",
    tagline: "A Blade component and PHP SDK, coming soon.",
    iconPath: siLaravel.path,
    iconColor: `#${siLaravel.hex}`,
    deviceType: "web",
    codeSnippet: {
      filename: "dashboard.blade.php",
      code: `@php
    Fewchurs::configure(apiKey: config('fewchurs.key'));
@endphp

<x-fewchurs::board />`,
    },
  },
];
