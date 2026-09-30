'use client';

import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useTransform } from 'framer-motion';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface CountUpNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

/** Animates from 0 to `value` on mount/change -- fast and purposeful, not a decorative flourish. */
export function CountUpNumber({ value, suffix = '', className }: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: EASE_OUT_EXPO });
    return controls.stop;
  }, [value, motionValue]);

  useEffect(
    () =>
      rounded.on('change', (v) => {
        if (ref.current) ref.current.textContent = `${v}${suffix}`;
      }),
    [rounded, suffix]
  );

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
