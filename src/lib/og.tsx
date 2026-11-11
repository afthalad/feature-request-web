import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Link-preview image size (Open Graph and X). */
export const OG_SIZE = { width: 1200, height: 630 };

const ORANGE = "#EE5A12";
const INK = "#171717";
const MUTED = "#6B6B6B";
const LINE = "#ECECEC";

/**
 * The share card in the home page's style: white page, faint grid, orange
 * corner squares, the logo, a big tight headline and a mono label.
 */
export async function renderOgImage({ eyebrow, headline }: { eyebrow: string; headline: string }) {
  const logo = await readFile(join(process.cwd(), "public/logo-mark.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  const corner = { position: "absolute" as const, width: 12, height: 12, background: ORANGE };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFFFFF",
          backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          padding: 56,
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: `2px solid ${LINE}`,
            padding: "56px 64px",
          }}
        >
          <div style={{ ...corner, top: -7, left: -7 }} />
          <div style={{ ...corner, top: -7, right: -7 }} />
          <div style={{ ...corner, bottom: -7, left: -7 }} />
          <div style={{ ...corner, bottom: -7, right: -7 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG, not a page */}
            <img src={logoSrc} width={64} height={64} alt="" />
            <span style={{ fontSize: 44, fontWeight: 700, color: INK, letterSpacing: -1.5 }}>Fewchurs</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <span style={{ fontSize: 22, color: MUTED, letterSpacing: 4, textTransform: "uppercase" }}>
              <span style={{ color: ORANGE }}>[</span>&nbsp;{eyebrow}&nbsp;<span style={{ color: ORANGE }}>]</span>
            </span>
            <span style={{ fontSize: 68, fontWeight: 700, color: INK, lineHeight: 1.04, letterSpacing: -2.5, maxWidth: 980 }}>
              {headline}
            </span>
          </div>

          <span style={{ fontSize: 24, color: MUTED }}>
            SwiftUI · Kotlin · Flutter · React · Next.js · Laravel
          </span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
