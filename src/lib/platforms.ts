import { Apple, Feather, Triangle, Hexagon, type LucideIcon } from "lucide-react";

export interface Platform {
  id: string;
  name: string;
  icon: LucideIcon;
  href?: string;
}

export const PLATFORMS: Platform[] = [
  { id: "swiftui", name: "SwiftUI", icon: Apple, href: "/docs/swiftui" },
  { id: "flutter", name: "Flutter", icon: Feather },
  { id: "nextjs", name: "Next.js", icon: Triangle },
  { id: "kotlin", name: "Kotlin", icon: Hexagon },
];
