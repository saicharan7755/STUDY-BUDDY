import { useEffect, useRef, useState } from 'react';

const DEMO_SRC = import.meta.env.VITE_LANDING_DEMO_MP4;

/**
 * Optional MP4 demo: set VITE_LANDING_DEMO_MP4=/cram-demo.mp4 in .env when the file exists.
 * Lazy-loads when the block enters the viewport; muted, loop, playsInline.
 */
export default function LazyDemoVideo({ className = '' }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!DEMO_SRC) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { rootMargin: '80px', threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !DEMO_SRC || !videoRef.current) return;
    const v = videoRef.current;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [inView]);

  if (!DEMO_SRC) return null;

  return (
    <div ref={wrapRef} className={className}>
      {inView ? (
        <video
          ref={videoRef}
          className="w-full rounded-2xl border border-white/10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)]"
          poster="/landing-hero-screenshot.svg"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          controls={false}
          aria-label="Screen recording of CRAM AI generating flashcards from notes"
        >
          <source src={DEMO_SRC} type="video/mp4" />
        </video>
      ) : (
        <div
          className="flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10 bg-surface/60 text-sm text-gray-500"
          aria-hidden
        >
          Loading preview…
        </div>
      )}
    </div>
  );
}
