import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

interface SparkleProps {
  children: ReactNode;
  /** Unique key so we only fire it once per session per element */
  sparkleKey: string;
  /** Fire on mount automatically (otherwise hover-only on desktop) */
  auto?: boolean;
  className?: string;
}

const PREFIX = 'gp_sparkle_';

const hasFired = (k: string): boolean => {
  try { return sessionStorage.getItem(PREFIX + k) === '1'; } catch { return false; }
};
const markFired = (k: string) => {
  try { sessionStorage.setItem(PREFIX + k, '1'); } catch { /* ignore */ }
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Wraps any element. On mount (if `auto`) or on hover (desktop), animates a
 * subtle 3-dot shimmer around the element. Honors prefers-reduced-motion and
 * fires at most once per `sparkleKey` per browser session.
 */
const Sparkle = ({ children, sparkleKey, auto = false, className }: SparkleProps) => {
  const wrapRef = useRef<HTMLSpanElement>(null);

  const fire = () => {
    if (prefersReducedMotion()) return;
    if (hasFired(sparkleKey)) return;
    const el = wrapRef.current;
    if (!el) return;
    markFired(sparkleKey);

    const dots: HTMLSpanElement[] = [];
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.cssText = [
        'position:absolute',
        'top:50%', 'left:50%',
        'width:6px', 'height:6px',
        'border-radius:9999px',
        'background:hsl(var(--accent-warm,38 78% 62%))',
        'pointer-events:none',
        'opacity:0',
        'box-shadow:0 0 8px hsl(var(--accent-warm,38 78% 62%) / 0.6)',
      ].join(';');
      el.appendChild(dot);
      dots.push(dot);
    }

    const tl = gsap.timeline({
      onComplete: () => dots.forEach(d => d.remove()),
    });
    dots.forEach((d, i) => {
      const angle = (i / dots.length) * Math.PI * 2;
      const radius = 18 + Math.random() * 8;
      tl.to(
        d,
        {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          opacity: 1,
          duration: 0.25,
          ease: 'power2.out',
        },
        i * 0.05,
      ).to(d, { opacity: 0, duration: 0.35, ease: 'power2.in' }, i * 0.05 + 0.25);
    });
  };

  useEffect(() => {
    if (!auto) return;
    if (typeof IntersectionObserver === 'undefined') {
      fire();
      return;
    }
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          fire();
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, sparkleKey]);

  return (
    <span
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={!auto ? fire : undefined}
    >
      {children}
    </span>
  );
};

export default Sparkle;
