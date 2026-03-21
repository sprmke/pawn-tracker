import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loanInvestors, receivedPayments, loans } from '@/db/schema';
import { eq, isNull, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * This endpoint fixes data inconsistencies in received_payments:
 *
 * 1. For completed interest periods that have no linked received payment, creates
 *    a received_payment row with the correct interest amount, properly linked via
 *    interestPeriodId.
 *
 * 2. Removes orphaned received_payments (interestPeriodId IS NULL) for
 *    hasMultipleInterest = true loan investors, since every multi-interest payment
 *    must be period-linked to display correctly in the UI and PDF.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all loans for this user with full investor/period/payment data
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

      // Loan-wide total principal (for 0-capital investors)
      const loanTotalPrincipal = loan.loanInvestors.reduce(
        (s, li) => s + (parseFloat(li.amount) || 0),
        0,
      );

      for (const li of loan.loanInvestors) {
        if (!li.hasMultipleInterest || !li.interestPeriods?.length) continue;

        // Completed periods sorted by due date
        const completedPeriods = li.interestPeriods
          .filter((p) => p.status === 'Completed')
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );

        if (completedPeriods.length === 0) continue;

        // Periods that already have a linked received payment
        const linkedPeriodIds = new Set(
          (li.receivedPayments || [])
            .filter((rp) => rp.interestPeriodId != null)
            .map((rp) => rp.interestPeriodId),
        );

        // Only create payments for completed periods without a linked payment
        const missingPeriods = completedPeriods.filter(
          (p) => !linkedPeriodIds.has(p.id),
        );

        if (missingPeriods.length === 0) continue;

        const investorPrincipal = parseFloat(li.amount) || 0;
        const principalBase =
          investorPrincipal === 0 ? loanTotalPrincipal : investorPrincipal;

        for (const period of missingPeriods) {
          const rate = parseFloat(period.interestRate) || 0;
          const interestAmount =
            period.interestType === 'fixed'
              ? rate
              : principalBase * (rate / 100);

          if (interestAmount <= 0) continue;

          // Always link to the specific period
          await db.insert(receivedPayments).values({
            loanInvestorId: li.id,
            interestPeriodId: period.id,
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

    // Step 2: Remove orphaned payments (interestPeriodId IS NULL) from multi-interest
    // loan investors across all user loans.  These can occur from old script runs.
    const multiInterestLiIds = userLoans
      .flatMap((loan) => loan.loanInvestors)
      .filter((li) => li.hasMultipleInterest)
      .map((li) => li.id);

    let orphanedDeleted = 0;
    if (multiInterestLiIds.length > 0) {
      const orphans = await db.query.receivedPayments.findMany({
        where: (rp, { and: qAnd, isNull: qIsNull, inArray: qInArray }) =>
          qAnd(
            qIsNull(rp.interestPeriodId),
            qInArray(rp.loanInvestorId, multiInterestLiIds),
          ),
      });

      if (orphans.length > 0) {
        const orphanIds = orphans.map((rp) => rp.id);
        await db
          .delete(receivedPayments)
          .where(inArray(receivedPayments.id, orphanIds));
        orphanedDeleted = orphanIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      createdPayments: createdPaymentsCount,
      orphanedPaymentsRemoved: orphanedDeleted,
      fixedLoans,
      message: `Created ${createdPaymentsCount} missing payment(s) and removed ${orphanedDeleted} orphaned payment(s) across ${fixedLoans.length} loan(s)`,
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
