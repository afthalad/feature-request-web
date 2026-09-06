import { siSwift, siFlutter, siNextdotjs, siKotlin } from "simple-icons";

export interface Platform {
  id: string;
  name: string;
  tagline: string;
  iconPath: string;
  iconColor: string;
  href?: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "swiftui",
    name: "SwiftUI",
    tagline: "A native board view, dropped into any SwiftUI app.",
    iconPath: siSwift.path,
    iconColor: `#${siSwift.hex}`,
    href: "/docs/swiftui",
  },
  {
    id: "flutter",
    name: "Flutter",
    tagline: "A Dart package with the same board, coming soon.",
    iconPath: siFlutter.path,
    iconColor: `#${siFlutter.hex}`,
  },
  {
    id: "nextjs",
    name: "Next.js",
    tagline: "A drop-in React component for web apps, coming soon.",
    iconPath: siNextdotjs.path,
    iconColor: `#${siNextdotjs.hex}`,
  },
  {
    id: "kotlin",
    name: "Kotlin",
    tagline: "A Jetpack Compose board for Android, coming soon.",
    iconPath: siKotlin.path,
    iconColor: `#${siKotlin.hex}`,
  },
];
