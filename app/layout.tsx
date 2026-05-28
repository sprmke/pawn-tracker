import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/layout/nav';
import { getCachedAuth } from '@/auth';
import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';
import { NavigationProgressProvider } from '@/components/common';
import { PriceVisibilityShell } from '@/components/layout/price-visibility-shell';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PawnTracker',
  description: 'Professional pawn business loan and investor management',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCachedAuth();

  return (
    <html lang="en">
      <body
        className={`${plusJakarta.className} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgressProvider>
            <Nav user={session?.user}>
              {session ? (
                <main className="app-shell min-h-screen p-4 sm:p-6 lg:p-8 xl:p-10">
                  <PriceVisibilityShell>
                    <div className="mx-auto max-w-[1680px]">{children}</div>
                  </PriceVisibilityShell>
                </main>
              ) : (
                <main className="min-h-screen">{children}</main>
              )}
            </Nav>
          </NavigationProgressProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
