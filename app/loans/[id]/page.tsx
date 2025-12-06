import { db } from '@/db';
import { investors, loans, loanInvestors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { LoanDetailClient } from './loan-detail-client';
import { auth } from '@/auth';

async function getInvestors(userId: string, loanId?: number) {
  try {
    // Get investors created by this user
    const ownedInvestors = await db.query.investors.findMany({
      where: eq(investors.userId, userId),
    });

    // If loanId provided, also get investors from this loan (for shared access)
    let sharedInvestors: any[] = [];
    if (loanId) {
      const loan = await db.query.loans.findFirst({
        where: eq(loans.id, loanId),
        with: {
          loanInvestors: {
            with: {
              investor: true,
            },
          },
        },
      });

      if (loan) {
        sharedInvestors = loan.loanInvestors.map((li) => li.investor);
      }
    }

    // Combine and deduplicate
    const allInvestorsMap = new Map();
    [...ownedInvestors, ...sharedInvestors].forEach((investor) => {
      allInvestorsMap.set(investor.id, investor);
    });

    return Array.from(allInvestorsMap.values());
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

async function getLoan(id: number, userId: string) {
  try {
    // First try to get loan if user owns it
    let loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.userId, userId)),
      with: {
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
          },
        },
        transactions: {
          orderBy: (transactions, { asc }) => [asc(transactions.date)],
        },
      },
    });

    // If not found, check if user is an investor in this loan
    if (!loan) {
      const investorRecord = await db.query.investors.findFirst({
        where: eq(investors.investorUserId, userId),
      });

      if (investorRecord) {
        // Check if this investor is part of this loan
        const loanInvestment = await db.query.loanInvestors.findFirst({
          where: and(
            eq(loanInvestors.loanId, id),
            eq(loanInvestors.investorId, investorRecord.id)
          ),
        });

        if (loanInvestment) {
          // User is an investor in this loan, fetch the full loan
          loan = await db.query.loans.findFirst({
            where: eq(loans.id, id),
            with: {
              loanInvestors: {
                with: {
                  investor: true,
                  interestPeriods: true,
                },
              },
              transactions: {
                orderBy: (transactions, { asc }) => [asc(transactions.date)],
              },
            },
          });
        }
      }
    }

    return loan;
  } catch (error) {
    console.error('Error fetching loan:', error);
    return null;
  }
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const loanId = parseInt(resolvedParams.id);

  if (isNaN(loanId)) {
    notFound();
  }

  const loan = await getLoan(loanId, session.user.id);

  if (!loan) {
    notFound();
  }

  const allInvestors = await getInvestors(session.user.id, loanId);

  return <LoanDetailClient loan={loan} investors={allInvestors} />;
}
