import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, interestPeriods, loanInvestors } from '@/db/schema';
import { eq, and, or, lt } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * This endpoint checks all loans and interest periods for the current user
 * and automatically updates their status to 'Overdue' if they are past their due date.
 * 
 * It should be called on:
 * - Dashboard page load
 * - Loans page load
 * - Investors page load
 * - Any page that displays loan/period information
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    let updatedLoansCount = 0;
    let updatedPeriodsCount = 0;

    // Get all loans for this user with their investors and periods
    const userLoans = await db.query.loans.findMany({
      where: eq(loans.userId, session.user.id),
      with: {
        loanInvestors: {
          with: {
            interestPeriods: true,
          },
        },
      },
    });

    // Process each loan
    for (const loan of userLoans) {
      let hasOverduePeriod = false;
      let hasAnyPendingPeriod = false;

      // Check and update interest periods
      for (const loanInvestor of loan.loanInvestors) {
        if (loanInvestor.hasMultipleInterest && loanInvestor.interestPeriods) {
          for (const period of loanInvestor.interestPeriods) {
            const periodDueDate = new Date(period.dueDate);
            
            // If period is Pending and past due date, mark as Overdue
            if (period.status === 'Pending' && now > periodDueDate) {
              await db
                .update(interestPeriods)
                .set({ status: 'Overdue', updatedAt: now })
                .where(eq(interestPeriods.id, period.id));
              
              updatedPeriodsCount++;
              hasOverduePeriod = true;
            } else if (period.status === 'Overdue') {
              hasOverduePeriod = true;
            } else if (period.status === 'Pending') {
              hasAnyPendingPeriod = true;
            }
          }
        }
      }

      // Check main loan due date for loans without multiple interest periods
      // or as a fallback check
      const loanDueDate = new Date(loan.dueDate);
      const hasMultipleInterestLoans = loan.loanInvestors.some(
        (li) => li.hasMultipleInterest
      );

      // Determine if we should update the loan status
      let shouldUpdateLoanStatus = false;
      let newLoanStatus = loan.status;

      // If there are overdue periods, loan should be overdue
      if (hasOverduePeriod && loan.status !== 'Overdue' && loan.status !== 'Completed') {
        newLoanStatus = 'Overdue';
        shouldUpdateLoanStatus = true;
      }
      // If loan is Fully Funded and main due date has passed
      // and there are no multiple interest periods (or all are completed/overdue)
      else if (
        loan.status === 'Fully Funded' &&
        now > loanDueDate &&
        !hasAnyPendingPeriod
      ) {
        newLoanStatus = 'Overdue';
        shouldUpdateLoanStatus = true;
      }
      // If loan is currently overdue but shouldn't be (e.g., all periods completed)
      else if (
        loan.status === 'Overdue' &&
        !hasOverduePeriod &&
        !hasAnyPendingPeriod &&
        now <= loanDueDate
      ) {
        newLoanStatus = 'Fully Funded';
        shouldUpdateLoanStatus = true;
      }

      // Update loan status if needed
      if (shouldUpdateLoanStatus) {
        await db
          .update(loans)
          .set({ status: newLoanStatus, updatedAt: now })
          .where(eq(loans.id, loan.id));
        
        updatedLoansCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedLoans: updatedLoansCount,
      updatedPeriods: updatedPeriodsCount,
      message: `Updated ${updatedLoansCount} loan(s) and ${updatedPeriodsCount} period(s)`,
    });
  } catch (error) {
    console.error('Error checking overdue statuses:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check overdue statuses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}





