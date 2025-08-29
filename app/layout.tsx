'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NavBar from "./NavBar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Engineering Discoverability for the Next Generation of Search</title>
        <meta name="description" content="Optimize your content to boost search rankings and earn more LLM citations. Our comprehensive suite of SEO tools helps you analyze, optimize, and improve your content's performance in search engines." />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body className={inter.className}>
        <Providers>
          <NavBar />
          <div style={{ paddingTop: 70 }}>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
