import { useEffect, useRef, useState } from 'react';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}

/**
 * Counts up to `value` when the element enters the viewport.
 */
export default function AnimatedCounter({ value, suffix = '', duration = 1400, className = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (reducedMotion) {
        setDisplay(value);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        setDisplay(Math.round(eased * value));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) run();
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration, reducedMotion]);

  return (
    <span ref={ref} className={className} aria-live="polite">
      {display}
      {suffix}
    </span>
  );
}
