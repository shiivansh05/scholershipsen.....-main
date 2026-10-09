import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface AnimatedScoreProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * AnimatedScore: Smooth Anime.js rolling numeric counter for risk points, scores & amounts.
 */
export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValRef = useRef<number>(0);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const startVal = prevValRef.current;
    const endVal = Number.isFinite(value) ? value : 0;
    prevValRef.current = endVal;

    const animObj = { count: startVal };

    const anim = animate(animObj, {
      count: endVal,
      duration,
      ease: 'outExpo',
      onUpdate: () => {
        if (el) {
          el.textContent = `${prefix}${Math.round(animObj.count).toLocaleString()}${suffix}`;
        }
      },
    });

    return () => {
      try {
        if (typeof (anim as any)?.pause === 'function') {
          (anim as any).pause();
        }
      } catch (_) {}
    };
  }, [value, duration, prefix, suffix]);

  return (
    <span ref={spanRef} className={`tabular-nums ${className}`}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
};

