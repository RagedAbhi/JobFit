import type { Metadata } from 'next';
import './globals.css';

const title = 'Resume Matcher';
const description =
  'AI-powered resume-to-job matching with skill gap analysis and improvement suggestions, entirely client-parsed and free to run.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
