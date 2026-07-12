'use client';

import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import NavBar from './NavBar';
import PipelineRail from '@/components/PipelineRail';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>LLMagnet — write once, get cited</title>
        <meta
          name="description"
          content="A newsroom desk for citeable stories: score your draft, check Google and X, polish with tracked changes, and see what rivals covered."
        />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} ${plexSans.className}`}>
        <Providers>
          <NavBar />
          <div className="app-shell">
            <PipelineRail />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
