import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Externa Next starter',
  description: 'Minimal headless frontend against Externa Public CMS API',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/">Externa starter</Link>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
