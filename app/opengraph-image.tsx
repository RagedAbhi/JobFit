import { ImageResponse } from 'next/og';
import { SiteOgImage, OG_IMAGE_SIZE } from '@/lib/og-image';

export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(<SiteOgImage />, { ...size });
}
