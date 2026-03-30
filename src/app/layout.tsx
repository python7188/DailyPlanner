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
      {/* 1. ROOT WRAPPER: At least the height of the screen, flex col */}
      {/* Note: I swapped min-h-screen to min-h-[100dvh] to preserve our previous mobile fix! */}
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col bg-[var(--color-bg)]">
        
        {/* 2. MAIN CONTENT SPRING: Eats up remaining vertical space */}
        <main className="flex-1 flex flex-col relative">
          {children}
        </main>

        {/* 3. GLOBAL FOOTER (If you ever add one, put it here, outside the main spring) */}
        {/* <footer>...</footer> */}
      </body>
    </html>
  );
}
