export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Severity color for a match score, shared by ScoreRing, MatchScoreGauge, and ScoreTrendSparkline. */
export function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}
