'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '@/lib/utils';

interface MatchScoreGaugeProps {
  score: number;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function MatchScoreGauge({ score }: MatchScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(clamped);
  const label = clamped >= 70 ? 'Strong Match' : clamped >= 40 ? 'Partial Match' : 'Weak Match';

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[140px] w-[140px]">
        <svg width={140} height={140} viewBox="0 0 120 120" className="absolute inset-0">
          <circle cx={60} cy={60} r={radius} stroke="var(--color-border)" strokeWidth={10} fill="none" />
          <motion.circle
            cx={60}
            cy={60}
            r={radius}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3, ease: EASE_OUT_EXPO }}
          className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-[var(--color-text)]"
        >
          {clamped}%
        </motion.div>
      </div>
      <span className="mt-2 text-sm font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
