import { getScoreColor } from '@/lib/utils';

export function ProfileCompleteness({ percent, hint }: { percent: number; hint: string | null }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const color = getScoreColor(percent);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4">
      <div className="relative h-12 w-12 shrink-0">
        <svg width={48} height={48} viewBox="0 0 48 48" className="-rotate-90">
          <circle cx={24} cy={24} r={radius} stroke="var(--color-border)" strokeWidth={4} fill="none" />
          <circle
            cx={24}
            cy={24}
            r={radius}
            stroke={color}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color }}>
          {percent}%
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Profile completeness</p>
        <p className="text-xs text-[var(--color-text-faint)]">
          {hint ?? 'Your profile has everything we use for matching.'}
        </p>
      </div>
    </div>
  );
}
