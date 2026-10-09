"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "floating" | "studio";

/** Transparent clips played back to back, then from the top again. */
const CLIPS = [
  {
    name: "hero-floating",
    label:
      "A user suggests a feature in an app, other users vote it to the top, the developer marks it Done, and the user sees the new feature live in the app.",
  },
  {
    name: "hero-platforms",
    label:
      "The same feature board works with iOS, SwiftUI, Flutter, Kotlin, React, Laravel and desktop apps, or as a public board link anyone can vote on without logging in.",
  },
];

// Every clip fades in from and out to full transparency, so the next one can start
// while the current one is fading out — a crossfade with no empty gap between them.
const HANDOFF_SECONDS = 0.45;

/**
 * "floating": transparent-background clips that sit directly on the page.
 *   Safari/iOS only decode transparency from HEVC, every other browser from VP9 WebM.
 * "studio": the dark studio render inside a rounded frame.
 */
export function HeroVideo({ variant = "floating" }: { variant?: Variant }) {
  if (variant === "studio") return <StudioVideo />;
  return <FloatingPlaylist />;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function FloatingPlaylist() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const currentRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const [ext, setExt] = useState<"webm" | "mov" | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ua = navigator.userAgent;
    const webkitOnly =
      /iPad|iPhone|iPod/.test(ua) || /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua);
    setExt(webkitOnly ? "mov" : "webm");
  }, []);

  useEffect(() => {
    if (!ext) return;
    const videos = videoRefs.current;
    if (reducedMotion) {
      videos.forEach((v) => v?.pause());
      return;
    }
    const resume = () => {
      const video = videos[currentRef.current];
      if (document.visibilityState === "visible" && video && video.paused && !video.ended) {
        video.play().catch(() => {});
      }
    };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [ext, reducedMotion]);

  const handOff = (from: number) => {
    if (from !== currentRef.current || reducedMotion) return;
    const next = (from + 1) % CLIPS.length;
    const video = videoRefs.current[next];
    if (!video) return;
    currentRef.current = next;
    setCurrent(next);
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  return (
    <div className="relative aspect-square w-full" role="img" aria-label={CLIPS[current].label}>
      {CLIPS.map((clip, i) => (
        <video
          key={clip.name}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          // The clip that just handed off fades out with CSS too, so its last frame can
          // never linger faintly behind the next one.
          className={cn(
            "absolute inset-0 size-full bg-transparent transition-opacity ease-out",
            i === current ? "opacity-100 duration-0" : "opacity-0 duration-500"
          )}
          poster={i === 0 ? "/videos/hero-floating-poster.png" : undefined}
          src={ext ? `/videos/${clip.name}.${ext}` : undefined}
          autoPlay={i === 0 && !reducedMotion}
          muted
          playsInline
          preload="auto"
          aria-hidden
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration - v.currentTime <= HANDOFF_SECONDS) handOff(i);
          }}
          onEnded={() => handOff(i)}
        />
      ))}
    </div>
  );
}

function StudioVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) video.pause();
    else video.play().catch(() => {});
  }, [reducedMotion]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#1c1917] shadow-lift">
      <video
        ref={videoRef}
        className="aspect-square w-full"
        poster="/videos/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={CLIPS[0].label}
      >
        <source src="/videos/hero.webm" type="video/webm" />
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
