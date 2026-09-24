interface SkillMatrixProps {
  matching: string[];
  missing: string[];
  optional: string[];
}

type Tone = 'success' | 'danger' | 'muted';

function badgeStyle(tone: Tone): React.CSSProperties {
  if (tone === 'muted') {
    return { backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' };
  }
  const color = tone === 'success' ? 'var(--color-success)' : 'var(--color-danger)';
  return {
    backgroundColor: `color-mix(in oklch, ${color} 16%, var(--color-surface))`,
    color,
  };
}

function SkillGroup({
  title,
  skills,
  tone,
  emptyLabel,
}: {
  title: string;
  skills: string[];
  tone: Tone;
  emptyLabel: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-[var(--color-text)]">{title}</h3>
      {skills.length === 0 ? (
        <p className="text-sm text-[var(--color-text-faint)]">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              style={badgeStyle(tone)}
              className="rounded-full px-3 py-1 text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillMatrix({ matching, missing, optional }: SkillMatrixProps) {
  return (
    <div className="space-y-5">
      <SkillGroup
        title="Matching Skills"
        skills={matching}
        tone="success"
        emptyLabel="No overlapping skills found."
      />
      <SkillGroup
        title="Missing Critical Skills"
        skills={missing}
        tone="danger"
        emptyLabel="No critical gaps detected."
      />
      <SkillGroup
        title="Optional / Nice-to-Have Gaps"
        skills={optional}
        tone="muted"
        emptyLabel="Nothing else to flag."
      />
    </div>
  );
}
