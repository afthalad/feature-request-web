import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Fewchurs: let your users tell you what to build next";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Feature request SDK",
    headline: "Let your users tell you what to build next.",
  });
}
