import { NextResponse } from 'next/server';
import { db } from '@/db';
import { interestPeriods, loanInvestors, loans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const periodId = parseInt(id);
    const { status } = await request.json();

    if (!status || !['Pending', 'Completed', 'Overdue'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be Pending, Completed, or Overdue.' },
        { status: 400 }
      );
    }

    // Get the interest period with loan investor info
    const period = await db.query.interestPeriods.findFirst({
      where: eq(interestPeriods.id, periodId),
      with: {
        loanInvestor: {
          with: {
            loan: true,
          },
        },
      },
    });

    if (!period) {
      return NextResponse.json(
        { error: 'Interest period not found' },
        { status: 404 }
      );
    }

    // Verify ownership through the loan
    if (period.loanInvestor.loan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the period status
    await db
      .update(interestPeriods)
      .set({ status, updatedAt: new Date() })
      .where(eq(interestPeriods.id, periodId));

    // After updating period, check if we need to update loan status
    // Get all periods for this loan
    const loanId = period.loanInvestor.loanId;
    const allLoanInvestors = await db.query.loanInvestors.findMany({
      where: eq(loanInvestors.loanId, loanId),
      with: {
        interestPeriods: true,
      },
    });

    // Collect all period statuses across all loan investors
    const allPeriods: Array<{ status: string }> = [];
    allLoanInvestors.forEach((li) => {
      if (li.hasMultipleInterest && li.interestPeriods) {
        allPeriods.push(...li.interestPeriods);
      }
    });

    // Check period statuses
    const hasOverduePeriod = allPeriods.some((p) => p.status === 'Overdue');
    const hasPendingPeriod = allPeriods.some((p) => p.status === 'Pending');
    const allPeriodsCompleted = allPeriods.length > 0 && allPeriods.every((p) => p.status === 'Completed');

    // Update loan status based on period statuses
    const currentLoan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
    });

    if (currentLoan) {
      let newLoanStatus = currentLoan.status;

      // Priority 1: If any period is overdue, loan should be overdue
      if (hasOverduePeriod) {
        newLoanStatus = 'Overdue';
      } 
      // Priority 2: If all periods are completed, automatically mark loan as completed
      else if (allPeriodsCompleted) {
        // Check if all loan investors are paid
        const allPaid = allLoanInvestors.every((li) => li.isPaid);
        
        if (allPaid) {
          // All periods completed and all paid - loan should be Completed
          newLoanStatus = 'Completed';
        }
      }
      // Priority 3: If loan was overdue but all periods are now pending/completed (no overdue)
      else if (currentLoan.status === 'Overdue' && !hasOverduePeriod) {
        newLoanStatus = 'Fully Funded';
      }

      // Update loan status if changed
      if (newLoanStatus !== currentLoan.status) {
        await db
          .update(loans)
          .set({ status: newLoanStatus, updatedAt: new Date() })
          .where(eq(loans.id, loanId));
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error updating interest period status:', error);
    return NextResponse.json(
      { error: 'Failed to update interest period status' },
      { status: 500 }
    );
  }
}

