// Shared between app/opengraph-image.tsx and app/twitter-image.tsx -- same
// visual, two file-convention entry points (Next.js requires each to have
// its own default export).
const CANVAS = '#15171d';
const ACCENT = '#22c3e6';
const TEXT = '#f1f3f6';
const TEXT_MUTED = '#9aa3af';

export function SiteOgImage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 90px',
        background: CANVAS,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -140,
          left: -100,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}33, transparent 70%)`,
          display: 'flex',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: ACCENT, display: 'flex' }} />
        <span style={{ fontSize: 30, fontWeight: 600, color: TEXT }}>Jobfit</span>
      </div>
      <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: TEXT, marginTop: 36, maxWidth: 920, lineHeight: 1.15 }}>
        Know your match score before you apply
      </div>
      <div style={{ display: 'flex', fontSize: 26, color: TEXT_MUTED, marginTop: 24, maxWidth: 820 }}>
        AI-powered resume-to-job matching with skill gap analysis and improvement suggestions.
      </div>
    </div>
  );
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
