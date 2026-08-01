import { useState, useEffect, useRef } from "react";
import COVER_PC2 from "@/assets/images/COVER-PC.avif";
import INTRO_1 from "@/assets/videos/office-intro.mp4";
import LOOP_1 from "@/assets/videos/office-loop.mp4";

const COVER_SRC = COVER_PC2;
const INTRO_SRC = INTRO_1;
const LOOP_SRC = LOOP_1;

export default function ScrollVideo() {
  const [phase, setPhase] = useState<"cover" | "intro" | "loop">("cover");

  const introRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const isInViewport = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  const resumeCurrentVideo = () => {
    if (phaseRef.current === "intro") introRef.current?.play().catch(() => {});
    if (phaseRef.current === "loop") loopRef.current?.play().catch(() => {});
  };

  const pauseAllVideos = () => {
    introRef.current?.pause();
    loopRef.current?.pause();
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (phaseRef.current === "cover") {
            setPhase("intro");
            introRef.current?.play().catch(() => {});
          } else {
            resumeCurrentVideo();
          }
        } else {
          pauseAllVideos();
        }
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pauseAllVideos();
      } else if (isInViewport()) {
        resumeCurrentVideo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      pauseAllVideos();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIntroEnd = () => {
    setPhase("loop");
    if (isInViewport() && !document.hidden) {
      loopRef.current?.play().catch(() => {});
    }
  };

  return (
    <div className="sv-wrapper" ref={containerRef}>
      <img
        src={COVER_SRC}
        alt=""
        aria-hidden="true"
        className={`sv-cover ${phase === "cover" ? "sv-visible" : "sv-hidden"}`}
      />

      <video
        ref={introRef}
        src={INTRO_SRC}
        className={`sv-video ${phase === "intro" ? "sv-visible" : "sv-hidden"}`}
        playsInline
        muted
        preload="auto"
        disablePictureInPicture
        onEnded={handleIntroEnd}
      />

      <video
        ref={loopRef}
        src={LOOP_SRC}
        className={`sv-video ${phase === "loop" ? "sv-visible" : "sv-hidden"}`}
        playsInline
        muted
        loop
        preload="auto"
        disablePictureInPicture
      />
    </div>
  );
}
