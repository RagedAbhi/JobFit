# Design

Dark-first product UI. Restrained color strategy: tinted neutrals + one precise accent. OKLCH throughout.

## Color

Neutral hue 255 (barely-there cool violet tint), chroma 0.004-0.01. Single brand accent: precise cyan-blue, hue 199 — deliberately not the generic indigo/blue-violet SaaS default. Semantic score colors are a separate traffic-light trio, distinct hues from the brand accent so they never get confused with "primary action."

| Token | OKLCH (dark, default) | OKLCH (light) | Use |
|---|---|---|---|
| `--color-canvas` | `oklch(0.15 0.006 255)` | `oklch(0.98 0.003 255)` | Page background |
| `--color-surface` | `oklch(0.19 0.007 255)` | `oklch(1 0 0)` | Cards, panels, nav |
| `--color-surface-raised` | `oklch(0.24 0.008 255)` | `oklch(0.97 0.004 255)` | Hover, active row |
| `--color-border` | `oklch(0.30 0.009 255)` | `oklch(0.90 0.005 255)` | Default border |
| `--color-border-subtle` | `oklch(0.24 0.008 255)` | `oklch(0.94 0.004 255)` | Quiet dividers |
| `--color-text` | `oklch(0.95 0.004 255)` | `oklch(0.18 0.006 255)` | Primary text |
| `--color-text-muted` | `oklch(0.70 0.006 255)` | `oklch(0.45 0.006 255)` | Secondary text |
| `--color-text-faint` | `oklch(0.52 0.007 255)` | `oklch(0.60 0.006 255)` | Tertiary/hints |
| `--color-accent` | `oklch(0.72 0.135 199)` | `oklch(0.55 0.135 199)` | Primary actions, focus, links, active nav |
| `--color-accent-strong` | `oklch(0.80 0.12 199)` | `oklch(0.48 0.14 199)` | Accent hover/pressed |
| `--color-success` | `oklch(0.72 0.15 152)` | `oklch(0.52 0.14 152)` | Strong match, matched skill |
| `--color-warning` | `oklch(0.78 0.15 75)` | `oklch(0.60 0.15 68)` | Partial match, optional gap |
| `--color-danger` | `oklch(0.68 0.18 25)` | `oklch(0.55 0.19 25)` | Weak match, missing critical skill |

Accent used only for: primary CTA, active nav item, focus rings, links, the brand mark. Never as page-wide decoration. Score bands (green/amber/red) are semantic data color, not brand color — they stay separate.

## Typography

Single family: system-ui stack. Fixed rem scale, ratio ~1.2. No display font.

- `text-xs` 0.75rem / `text-sm` 0.875rem / `text-base` 1rem / `text-lg` 1.125rem / `text-xl` 1.35rem / `text-2xl` 1.6rem
- Weight contrast does the hierarchy work, not size alone: 400 body, 500 labels/nav, 600 headings/scores.

## Layout

- App shell: top nav (not sidebar — single primary flow, doesn't need persistent side nav yet).
- Dashboard: greeting line (name-based) + primary action, then a job list. Cards only where they earn it (each job is a genuinely distinct, clickable record); no nested cards.
- Spacing rhythm: 4/8/12/16/24/32/48, varied deliberately between tight (list rows) and generous (section breaks).

## Motion

150-250ms, ease-out-expo. Conveys state only: list items stagger in on the dashboard's initial load (data arriving), score gauge sweeps in once on mount, hover/press feedback on interactive elements. No idle/ambient animation, no orchestrated multi-second intro sequences.

## Components

- Buttons: one shape/radius vocabulary across the app. Primary = solid accent. Secondary = bordered, neutral. Both share the same height/radius/focus-ring treatment.
- Focus ring: 2px accent, offset 2px, on every interactive element (replaces browser default uniformly).
- Job card: no icon-in-a-box header. Leads with the score as the primary visual element (a small ring/bar, not a big hero number), title + summary as text, quiet metadata (date) at the bottom. Hover raises to `--color-surface-raised` with a 1px border tint toward accent, no shadow-heavy elevation.
