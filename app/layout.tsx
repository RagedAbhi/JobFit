import type { Metadata } from 'next';
import './globals.css';

const title = 'Jobfit';
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

// Sets data-theme on <html> before paint, from a prior explicit choice
// (ThemeToggle writes to localStorage) -- avoids a flash of the wrong theme.
// Absent a stored choice, no attribute is set and CSS falls back to OS
// preference (see app/globals.css).
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
