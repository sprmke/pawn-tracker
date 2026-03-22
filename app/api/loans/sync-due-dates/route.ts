/**
 * Data migration: update each loan's dueDate to match the latest interest period
 * due date across all of its investors (for loans that have multiple interest periods).
 *
 * Only updates loans where at least one investor has hasMultipleInterest = true
 * AND the loan's current dueDate differs from the max interest period dueDate.
 */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, interestPeriods } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user loans that have at least one multi-interest investor
    const userLoans = await db.query.loans.findMany({
      where: eq(loans.userId, session.user.id),
      with: {
        loanInvestors: {
          where: eq(loanInvestors.hasMultipleInterest, true),
          with: {
            interestPeriods: true,
          },
        },
      },
    });

    const updatedLoans: string[] = [];
    const skippedLoans: string[] = [];

    for (const loan of userLoans) {
      // Collect all interest period due dates across investors
      const allDueDates: Date[] = [];
      for (const li of loan.loanInvestors) {
        for (const period of li.interestPeriods) {
          allDueDates.push(new Date(period.dueDate));
        }
      }

      if (allDueDates.length === 0) {
        // No interest periods found — skip
        skippedLoans.push(loan.loanName);
        continue;
      }

      // Find the latest due date across all interest periods
      const latestDueDate = new Date(
        Math.max(...allDueDates.map((d) => d.getTime())),
      );

      const currentDueDate = new Date(loan.dueDate);

      // Compare at day precision (ignore time)
      const isSameDay =
        latestDueDate.toISOString().slice(0, 10) ===
        currentDueDate.toISOString().slice(0, 10);

      if (isSameDay) {
        skippedLoans.push(loan.loanName);
        continue;
      }

      await db
        .update(loans)
        .set({ dueDate: latestDueDate, updatedAt: new Date() })
        .where(
          and(eq(loans.id, loan.id), eq(loans.userId, session.user.id)),
        );

      updatedLoans.push(loan.loanName);
    }

    const message =
      updatedLoans.length === 0
        ? 'All loan due dates are already up to date.'
        : `Updated ${updatedLoans.length} loan(s): ${updatedLoans.join(', ')}`;

    return NextResponse.json({
      success: true,
      updatedCount: updatedLoans.length,
      skippedCount: skippedLoans.length,
      updatedLoans,
      message,
    });
  } catch (error) {
    console.error('Error syncing loan due dates:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync loan due dates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
