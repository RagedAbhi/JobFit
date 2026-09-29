import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Matches the app's actual design tokens (app/globals.css): dark canvas +
// the single cyan-blue accent used everywhere else (nav dot, buttons,
// score-ring highlight). ImageResponse's renderer doesn't resolve CSS custom
// properties, so these are the same colors expressed as plain hex.
const CANVAS = '#15171d';
const ACCENT = '#22c3e6';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: CANVAS,
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: `3px solid ${ACCENT}`,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
