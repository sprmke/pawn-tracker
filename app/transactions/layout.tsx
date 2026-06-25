import { redirect } from 'next/navigation';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!SHOW_TRANSACTIONS_UI) {
    redirect('/dashboard');
  }

  return children;
}
