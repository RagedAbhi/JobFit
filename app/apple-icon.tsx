import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const CANVAS = '#15171d';
const ACCENT = '#22c3e6';

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            border: `16px solid ${ACCENT}`,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
