/**
 * Safe cleanup of orphaned received_payments.
 *
 * IMPORTANT ORDER OF OPERATIONS:
 * 1. First, recreate any missing received_payments for "Completed" interest periods
 *    that have no linked payment (these may have been lost if an old cleanup deleted
 *    payments that had interestPeriodId = NULL before the column existed).
 * 2. Then delete orphaned received_payments (interestPeriodId IS NULL) for
 *    hasMultipleInterest = true investors.
 *
 * Running fix-before-clean ensures we never delete a payment that is the only
 * record backing a Completed period, which would silently zero out totalReceived.
 */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, receivedPayments, interestPeriods } from '@/db/schema';
import { eq, isNull, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { calculateInterest } from '@/lib/calculations';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all user loans with full investor + period + payment data
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

    // ── Step 1: Restore missing linked payments for Completed periods ───────────
    let restoredCount = 0;

    for (const loan of userLoans) {
      const loanTotalPrincipal = loan.loanInvestors.reduce(
        (s, li) => s + (parseFloat(li.amount) || 0),
        0,
      );

      for (const li of loan.loanInvestors) {
        if (!li.hasMultipleInterest || !li.interestPeriods?.length) continue;

        const completedPeriods = li.interestPeriods.filter(
          (p) => p.status === 'Completed',
        );
        if (completedPeriods.length === 0) continue;

        // Which periods already have a linked payment?
        const linkedPeriodIds = new Set(
          (li.receivedPayments || [])
            .filter((rp) => rp.interestPeriodId != null)
            .map((rp) => rp.interestPeriodId),
        );

        const missingPeriods = completedPeriods.filter(
          (p) => !linkedPeriodIds.has(p.id),
        );
        if (missingPeriods.length === 0) continue;

        const investorPrincipal = parseFloat(li.amount) || 0;
        const principalBase =
          investorPrincipal === 0 ? loanTotalPrincipal : investorPrincipal;

        for (const period of missingPeriods) {
          const interestAmount = calculateInterest(
            principalBase,
            period.interestRate,
            period.interestType,
          );
          if (interestAmount <= 0) continue;

          await db.insert(receivedPayments).values({
            loanInvestorId: li.id,
            interestPeriodId: period.id,
            amount: String(interestAmount),
            receivedDate: new Date(period.dueDate),
          });

          restoredCount++;
        }
      }
    }

    // ── Step 2: Delete orphaned payments (interestPeriodId IS NULL) ─────────────
    const multiInterestLiIds = userLoans
      .flatMap((l) => l.loanInvestors)
      .filter((li) => li.hasMultipleInterest)
      .map((li) => li.id);

    let deletedCount = 0;
    const affectedLoans: string[] = [];

    if (multiInterestLiIds.length > 0) {
      const orphans = await db.query.receivedPayments.findMany({
        where: (rp, { and, isNull: qIsNull, inArray: qInArray }) =>
          and(
            qIsNull(rp.interestPeriodId),
            qInArray(rp.loanInvestorId, multiInterestLiIds),
          ),
      });

      if (orphans.length > 0) {
        const orphanIds = orphans.map((rp) => rp.id);
        await db
          .delete(receivedPayments)
          .where(inArray(receivedPayments.id, orphanIds));

        deletedCount = orphanIds.length;

        // Identify which loans were affected for reporting
        const affectedLiIds = new Set(orphans.map((rp) => rp.loanInvestorId));
        for (const loan of userLoans) {
          if (
            loan.loanInvestors.some((li) => affectedLiIds.has(li.id))
          ) {
            affectedLoans.push(loan.loanName);
          }
        }
      }
    }

    const parts: string[] = [];
    if (restoredCount > 0) parts.push(`Restored ${restoredCount} missing payment(s)`);
    if (deletedCount > 0) parts.push(`Removed ${deletedCount} orphaned payment(s)`);

    return NextResponse.json({
      success: true,
      restoredCount,
      deletedCount,
      affectedLoans,
      message:
        parts.length > 0
          ? parts.join(', ') +
            (affectedLoans.length > 0
              ? ` — loans: ${affectedLoans.join(', ')}`
              : '')
          : 'Nothing to clean up. All payments are consistent.',
    });
  } catch (error) {
    console.error('Error cleaning up orphaned payments:', error);
    return NextResponse.json(
      {
        error: 'Failed to clean up orphaned payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
