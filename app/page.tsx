import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCachedAuth } from '@/auth';
import { LandingPage } from '@/components/landing';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

export const metadata: Metadata = {
  title: 'PawnTracker — Smart Pawn Business Management',
  description: SHOW_TRANSACTIONS_UI
    ? 'Track loans, manage investors, and monitor transactions in one modern platform built for pawn businesses.'
    : 'Track loans, manage investors, and monitor borrowings in one modern platform built for pawn businesses.',
};

export default async function HomePage() {
  const session = await getCachedAuth();

  if (session) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
