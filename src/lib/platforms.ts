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
    name: "SwiftUII",
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
    tagline:
      "A server-rendered board, with your API key staying on the server.",
    iconPath: siNextdotjs.path,
    iconColor: `#${siNextdotjs.hex}`,
    href: "/docs/nextjs",
    deviceType: "web",
    codeSnippet: {
      filename: "app/feedback/page.tsx",
      code: `import { FewchursBoard } from "@fewchurs/next";

export default function Page() {
  return <FewchursBoard />;
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
    tagline: "A drop-in board for Vite, CRA — any React app.",
    iconPath: siReact.path,
    iconColor: `#${siReact.hex}`,
    href: "/docs/react",
    deviceType: "web",
    codeSnippet: {
      filename: "App.tsx",
      code: `import { FewchursBoard, FewchursProvider } from "@fewchurs/react";

<FewchursProvider apiKey="fr_live_xxx">
  <FewchursBoard />
</FewchursProvider>`,
    },
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
