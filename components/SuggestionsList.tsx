import type { ImprovementSuggestion } from '@/types/analysis';

interface SuggestionsListProps {
  suggestions: ImprovementSuggestion[];
}

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  const grouped = suggestions.reduce<Record<string, ImprovementSuggestion[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-[var(--color-text)]">Improvement Suggestions</h3>
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              {category}
            </p>
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-muted)]"
                >
                  {item.suggestion}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
