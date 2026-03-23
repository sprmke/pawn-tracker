import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  receivedPayments,
  interestPeriods,
  loanInvestors,
} from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { auth } from '@/auth';
import { calculateInterest } from '@/lib/calculations';
import {
  recalculateInterestPeriodStatusFromLinkedPayments,
  syncLoanStatusFromInterestPeriods,
} from '@/lib/loan-interest-period-sync';

const AMOUNT_TOLERANCE = 0.02;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const paymentId = parseInt(id, 10);
    if (!Number.isFinite(paymentId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const rawAmt = body.amount;
    const receivedDate = body.receivedDate;
    const parsedAmount =
      rawAmt === '' || rawAmt === null || rawAmt === undefined
        ? NaN
        : parseFloat(String(rawAmt));
    const dateStr =
      receivedDate === null || receivedDate === undefined
        ? ''
        : String(receivedDate).trim();

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

    const rp = await db.query.receivedPayments.findFirst({
      where: eq(receivedPayments.id, paymentId),
      with: {
        loanInvestor: {
          with: {
            loan: true,
          },
        },
      },
    });

    if (!rp) {
      return NextResponse.json(
        { error: 'Received payment not found' },
        { status: 404 },
      );
    }

    if (rp.loanInvestor.loan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const periodId = rp.interestPeriodId;
    const loanId = rp.loanInvestor.loanId;

    if (periodId != null) {
      const others = await db.query.receivedPayments.findMany({
        where: and(
          eq(receivedPayments.interestPeriodId, periodId),
          ne(receivedPayments.id, paymentId),
        ),
      });
      const otherSum = others.reduce(
        (s, row) => s + (parseFloat(row.amount) || 0),
        0,
      );
      const newTotal = otherSum + parsedAmount;

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
          { status: 400 },
        );
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

      if (newTotal > expectedInterest + AMOUNT_TOLERANCE) {
        return NextResponse.json(
          {
            error: `Amount would exceed the interest due for this period (${expectedInterest.toFixed(2)}). Maximum for this line: ${(expectedInterest - otherSum).toFixed(2)}.`,
          },
          { status: 400 },
        );
      }
    }

    await db
      .update(receivedPayments)
      .set({
        amount: String(parsedAmount),
        receivedDate: receivedDateObj,
        updatedAt: new Date(),
      })
      .where(eq(receivedPayments.id, paymentId));

    if (periodId != null) {
      await recalculateInterestPeriodStatusFromLinkedPayments(periodId);
    }

    await syncLoanStatusFromInterestPeriods(loanId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating received payment:', error);
    return NextResponse.json(
      { error: 'Failed to update received payment' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const paymentId = parseInt(id, 10);
    if (!Number.isFinite(paymentId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const rp = await db.query.receivedPayments.findFirst({
      where: eq(receivedPayments.id, paymentId),
      with: {
        loanInvestor: {
          with: {
            loan: true,
          },
        },
      },
    });

    if (!rp) {
      return NextResponse.json(
        { error: 'Received payment not found' },
        { status: 404 },
      );
    }

    if (rp.loanInvestor.loan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const periodId = rp.interestPeriodId;
    const loanId = rp.loanInvestor.loanId;

    await db.delete(receivedPayments).where(eq(receivedPayments.id, paymentId));

    if (periodId != null) {
      await recalculateInterestPeriodStatusFromLinkedPayments(periodId);
    }

    await syncLoanStatusFromInterestPeriods(loanId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting received payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete received payment' },
      { status: 500 },
    );
  }
}
