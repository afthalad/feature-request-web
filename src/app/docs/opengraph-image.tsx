import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Fewchurs docs: add a feature request board to your app";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Docs",
    headline: "Add a feature request board to your app in minutes.",
  });
}
