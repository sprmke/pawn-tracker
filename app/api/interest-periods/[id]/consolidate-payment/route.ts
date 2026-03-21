/**
 * Replace all received_payments linked to an interest period with a single row.
 * Used when multiple partial payments exist and the user edits the total in one step.
 */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { interestPeriods, loanInvestors, receivedPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { calculateInterest } from '@/lib/calculations';
import {
  recalculateInterestPeriodStatusFromLinkedPayments,
  syncLoanStatusFromInterestPeriods,
} from '@/lib/loan-interest-period-sync';

const AMOUNT_TOLERANCE = 0.02;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const periodId = parseInt(id, 10);
    if (!Number.isFinite(periodId)) {
      return NextResponse.json({ error: 'Invalid period id' }, { status: 400 });
    }

    const body = await request.json();
    const rawAmt = body.amount;
    const receivedDateRaw = body.receivedDate;
    const parsedAmount =
      rawAmt === '' || rawAmt === null || rawAmt === undefined
        ? NaN
        : parseFloat(String(rawAmt));
    const dateStr =
      receivedDateRaw === null || receivedDateRaw === undefined
        ? ''
        : String(receivedDateRaw).trim();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Enter a valid received amount greater than zero.' },
        { status: 400 },
      );
    }
    if (!dateStr) {
      return NextResponse.json(
        { error: 'Received date is required.' },
        { status: 400 },
      );
    }
    const receivedDateObj = new Date(dateStr);
    if (Number.isNaN(receivedDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid received date.' },
        { status: 400 },
      );
    }

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
        { status: 404 },
      );
    }

    if (period.loanInvestor.loan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coInvestors = await db.query.loanInvestors.findMany({
      where: eq(loanInvestors.loanId, period.loanInvestor.loanId),
    });
    const loanTotalPrincipal = coInvestors.reduce(
      (s, li) => s + (parseFloat(li.amount) || 0),
      0,
    );
    const investorPrincipal = parseFloat(period.loanInvestor.amount) || 0;
    const principalBase =
      investorPrincipal === 0 ? loanTotalPrincipal : investorPrincipal;
    const expectedInterest = calculateInterest(
      principalBase,
      period.interestRate,
      period.interestType,
    );

    if (parsedAmount > expectedInterest + AMOUNT_TOLERANCE) {
      return NextResponse.json(
        {
          error: `Amount cannot exceed the interest due for this period (${expectedInterest.toFixed(2)}).`,
        },
        { status: 400 },
      );
    }

    const loanId = period.loanInvestor.loanId;

    await db
      .delete(receivedPayments)
      .where(eq(receivedPayments.interestPeriodId, periodId));

    await db.insert(receivedPayments).values({
      loanInvestorId: period.loanInvestor.id,
      interestPeriodId: periodId,
      amount: String(parsedAmount),
      receivedDate: receivedDateObj,
    });

    await recalculateInterestPeriodStatusFromLinkedPayments(periodId);
    await syncLoanStatusFromInterestPeriods(loanId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error consolidating period payments:', error);
    return NextResponse.json(
      { error: 'Failed to update payments' },
      { status: 500 },
    );
  }
}
