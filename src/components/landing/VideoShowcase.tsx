"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { SectionHeading } from "@/components/landing-v2/Frame";
import { cn } from "@/lib/utils";

/** The transparent-background clips in public/videos, played as one playlist. */
const CLIPS = [
  {
    name: "hero-floating",
    title: "The whole loop",
    line: "Someone suggests a feature, others vote it to the top, you mark it Done, and they see it live in your app.",
  },
  {
    name: "hero-platforms",
    title: "On every platform",
    line: "The same board in iOS, Android, Flutter, React and Laravel apps, or as a public link anyone can vote on.",
  },
];

/**
 * "See it in action": the product clips on the page's grid, with chapters
 * that show progress and jump between clips. Plays muted only while on
 * screen, never auto-plays for reduced motion, and always has a pause button.
 */
export function VideoShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [ext, setExt] = useState<"webm" | "mov" | null>(null);
  const [load, setLoad] = useState(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentRef = useRef(0);
  const inView = useRef(false);
  const userPaused = useRef(false);
  const reduced = useRef(false);

  // Safari and iOS only decode transparency from HEVC (.mov); everyone else from VP9 WebM.
  useEffect(() => {
    const ua = navigator.userAgent;
    const webkitOnly =
      /iPad|iPhone|iPod/.test(ua) || /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua);
    setExt(webkitOnly ? "mov" : "webm");
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) userPaused.current = true;
  }, []);

  const play = (index: number) => {
    const v = videoRefs.current[index];
    if (!v) return;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };
  const pauseAll = () => {
    videoRefs.current.forEach((v) => v?.pause());
    setPlaying(false);
  };

  // Fetch the clips shortly before they scroll in; play only while visible.
  useEffect(() => {
    const el = rootRef.current;
    const stage = stageRef.current;
    if (!el || !stage) return;
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          near.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    const seen = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        if (!e.isIntersecting) pauseAll();
        else if (!userPaused.current) play(currentRef.current);
      },
      { threshold: 0.4 },
    );
    near.observe(el);
    // Watch the video itself: on phones the whole section is taller than the screen.
    seen.observe(stage);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, []);

  // Jumping straight to the section (a link, a fast scroll) can make it visible
  // before the clips have a source, so start once the source is set.
  useEffect(() => {
    if (load && ext && inView.current && !userPaused.current) play(currentRef.current);
  }, [load, ext]);

  const goTo = (index: number, autoplay: boolean) => {
    videoRefs.current.forEach((v, i) => {
      if (v && i !== index) v.pause();
    });
    currentRef.current = index;
    setCurrent(index);
    setProgress(0);
    const v = videoRefs.current[index];
    if (v) v.currentTime = 0;
    if (autoplay) play(index);
  };

  const toggle = () => {
    if (playing) {
      userPaused.current = true;
      pauseAll();
    } else {
      userPaused.current = false;
      play(currentRef.current);
    }
  };

  return (
    <div ref={rootRef} className="grid lg:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-center gap-10 px-5 py-16 sm:px-10 sm:py-20">
        <SectionHeading
          eyebrow="See it in action"
          title="From “I wish it could…” to “It shipped.”"
          body="This is what your users see, and what you do on your side. No backend, no forms to build."
        />
        <ol className="border-y border-border">
          {CLIPS.map((clip, i) => {
            const active = i === current;
            return (
              <li key={clip.name} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  aria-current={active ? "step" : undefined}
                  onClick={() => {
                    userPaused.current = false;
                    goTo(i, true);
                  }}
                  className="group relative flex w-full gap-4 py-5 text-left"
                >
                  <span
                    className={cn(
                      "font-mono text-xs transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span
                      className={cn(
                        "block text-lg font-semibold tracking-[-0.02em] transition-colors",
                        active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {clip.title}
                    </span>
                    <span className="block text-sm leading-relaxed text-muted-foreground">{clip.line}</span>
                  </span>
                  <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
                    <span
                      className="block h-full origin-left bg-primary transition-transform duration-300 ease-linear"
                      style={{ transform: `scaleX(${active ? progress : 0})` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="lv2-cell-grid relative border-t border-border lg:border-t-0 lg:border-l">
        <div
          ref={stageRef}
          className="relative mx-auto aspect-square w-full max-w-[600px]"
          role="img"
          aria-label={`${CLIPS[current].title}: ${CLIPS[current].line}`}
        >
          {CLIPS.map((clip, i) => (
            <video
              key={clip.name}
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              aria-hidden
              muted
              playsInline
              preload={i === 0 ? "auto" : "metadata"}
              poster={i === 0 ? "/videos/hero-floating-poster.png" : undefined}
              src={load && ext ? `/videos/${clip.name}.${ext}` : undefined}
              className={cn(
                "absolute inset-0 size-full bg-transparent transition-opacity duration-500",
                i === current ? "opacity-100" : "opacity-0",
              )}
              onTimeUpdate={(e) => {
                if (i !== currentRef.current) return;
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              onEnded={() => {
                if (i !== currentRef.current) return;
                goTo((i + 1) % CLIPS.length, inView.current && !userPaused.current);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full border border-border bg-background/85 py-1.5 pr-3.5 pl-2.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase backdrop-blur transition-colors hover:text-foreground"
        >
          <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
            {playing ? <Pause className="size-3" fill="currentColor" /> : <Play className="size-3" fill="currentColor" />}
          </span>
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
