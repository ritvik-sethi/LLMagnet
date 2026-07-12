'use client';

import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import NavBar from './NavBar';
import PipelineRail from '@/components/PipelineRail';
import ArticleContextBar from '@/components/ArticleContextBar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>LLMagnet — write once, get cited</title>
        <meta
          name="description"
          content="Article editing for citeable stories: score your draft, check Google and X, polish with researched rewrites, and see what rivals covered."
        />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${spaceGrotesk.className}`}>
        <Providers>
          <NavBar />
          <div className="app-shell">
            <PipelineRail />
            <ArticleContextBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
