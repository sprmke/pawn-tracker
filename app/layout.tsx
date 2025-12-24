import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/layout/nav';
import { auth } from '@/auth';
import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';
import { NavigationProgressProvider } from '@/components/common';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pawn Business Tracker',
  description: 'Track pawn business loans and investor transactions',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgressProvider>
            <Nav user={session?.user}>
              {session ? (
                <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
                  <div className="mx-auto max-w-[1600px]">{children}</div>
                </main>
              ) : (
                <main className="min-h-screen">
                  {children}
                </main>
              )}
            </Nav>
          </NavigationProgressProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
