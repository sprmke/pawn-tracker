import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loanInvestors, interestPeriods, receivedPayments, loans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * This endpoint fixes the data inconsistency where interest periods are marked
 * as "Completed" but no corresponding receivedPayments records exist.
 *
 * For each loanInvestor with hasMultipleInterest:
 * - Fetches all completed periods sorted by due date
 * - Counts existing received payments
 * - For each completed period without a matching received payment (by count), 
 *   creates a received payment record using the period's interest amount and due date
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all loans for this user
    const userLoans = await db.query.loans.findMany({
      where: eq(loans.userId, session.user.id),
      with: {
        loanInvestors: {
          with: {
            interestPeriods: true,
            receivedPayments: true,
          },
        },
      },
    });

    let createdPaymentsCount = 0;
    const fixedLoans: string[] = [];

    for (const loan of userLoans) {
      let loanFixed = false;

      for (const li of loan.loanInvestors) {
        if (!li.hasMultipleInterest || !li.interestPeriods?.length) continue;

        // Get completed periods sorted by due date
        const completedPeriods = li.interestPeriods
          .filter((p) => p.status === 'Completed')
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );

        if (completedPeriods.length === 0) continue;

        const existingPaymentsCount = (li.receivedPayments || []).length;

        // Periods that need a received payment (those beyond what's already recorded)
        const missingPeriods = completedPeriods.slice(existingPaymentsCount);

        if (missingPeriods.length === 0) continue;

        // Calculate the principal for this loan investor
        const principal = parseFloat(li.amount) || 0;

        for (const period of missingPeriods) {
          const rate = parseFloat(period.interestRate) || 0;
          const interestAmount =
            period.interestType === 'fixed'
              ? rate
              : principal * (rate / 100);

          if (interestAmount <= 0) continue;

          await db.insert(receivedPayments).values({
            loanInvestorId: li.id,
            amount: String(interestAmount),
            receivedDate: new Date(period.dueDate),
          });

          createdPaymentsCount++;
          loanFixed = true;
        }
      }

      if (loanFixed) {
        fixedLoans.push(loan.loanName);
      }
    }

    return NextResponse.json({
      success: true,
      createdPayments: createdPaymentsCount,
      fixedLoans,
      message: `Created ${createdPaymentsCount} missing received payment(s) across ${fixedLoans.length} loan(s)`,
    });
  } catch (error) {
    console.error('Error fixing received payments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix received payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
