import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Daily Planner · Elite Edition',
  description: 'A premium daily planner with macro goals, task management, and an interactive calendar.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col bg-[var(--color-bg)]">
        <main className="flex-1 flex flex-col relative">
          {children}
        </main>
      </body>
    </html>
  );
}
