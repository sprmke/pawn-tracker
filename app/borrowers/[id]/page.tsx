import { db } from '@/db';
import { borrowers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getCachedAuth } from '@/auth';
import { BorrowerDetailClient } from './borrower-detail-client';

async function getBorrower(id: number, userId: string) {
  try {
    return await db.query.borrowers.findFirst({
      where: and(eq(borrowers.id, id), eq(borrowers.userId, userId)),
      with: {
        loans: {
          columns: { id: true },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching borrower:', error);
    return null;
  }
}

export default async function BorrowerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCachedAuth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const borrowerId = parseInt(resolvedParams.id, 10);

  if (Number.isNaN(borrowerId)) {
    notFound();
  }

  const borrower = await getBorrower(borrowerId, session.user.id);

  if (!borrower) {
    notFound();
  }

  return <BorrowerDetailClient borrower={borrower} />;
}
