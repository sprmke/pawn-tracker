import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  debtInterestPeriods,
  debtReceivedPayments,
  debts,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { hasDebtAccess } from '@/lib/access-control';
import {
  DEBT_AMOUNT_TOLERANCE,
  recalculateDebtInterestPeriodStatus,
} from '@/lib/debt-interest-period-sync';

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
    const periodId = parseInt(id, 10);
    const { status, receivedAmount, receivedDate } = await request.json();

    if (!status || !['Pending', 'Completed', 'Overdue'].includes(status)) {
      return NextResponse.json(
        {
          error:
            'Invalid status. Must be Pending, Completed (record payment), or Overdue.',
        },
        { status: 400 },
      );
    }

    const period = await db.query.debtInterestPeriods.findFirst({
      where: eq(debtInterestPeriods.id, periodId),
      with: {
        debt: true,
        receivedPayments: true,
      },
    });

    if (!period) {
      return NextResponse.json(
        { error: 'Interest period not found' },
        { status: 404 },
      );
    }

    const hasAccess = await hasDebtAccess(period.debtId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expectedAmount = parseFloat(period.expectedInterest) || 0;
    let responseStatus: string = status;

    if (status === 'Completed') {
      if (period.status === 'Completed') {
        return NextResponse.json(
          { error: 'This period is already completed.' },
          { status: 400 },
        );
      }

      const parsedAmount = parseFloat(String(receivedAmount ?? ''));
      const dateStr = String(receivedDate ?? '').trim();

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          {
            error:
              'Enter a valid received amount greater than zero to record this payment.',
          },
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

      const priorTotal = (period.receivedPayments ?? []).reduce(
        (sum, payment) => sum + (parseFloat(payment.amount) || 0),
        0,
      );

      if (priorTotal + DEBT_AMOUNT_TOLERANCE >= expectedAmount) {
        return NextResponse.json(
          { error: 'This period is already fully paid.' },
          { status: 400 },
        );
      }

      const newTotal = priorTotal + parsedAmount;
      if (newTotal > expectedAmount + DEBT_AMOUNT_TOLERANCE) {
        return NextResponse.json(
          {
            error: `This payment would exceed the amount due for this period (${expectedAmount.toFixed(2)}). Remaining: ${(expectedAmount - priorTotal).toFixed(2)}.`,
          },
          { status: 400 },
        );
      }

      const newPeriodStatus =
        newTotal + DEBT_AMOUNT_TOLERANCE >= expectedAmount
          ? 'Completed'
          : 'Incomplete';

      await db
        .update(debtInterestPeriods)
        .set({ status: newPeriodStatus, updatedAt: new Date() })
        .where(eq(debtInterestPeriods.id, periodId));

      await db.insert(debtReceivedPayments).values({
        debtInterestPeriodId: periodId,
        amount: String(parsedAmount),
        receivedDate: receivedDateObj,
      });

      responseStatus = newPeriodStatus;
    } else {
      await db
        .update(debtInterestPeriods)
        .set({ status, updatedAt: new Date() })
        .where(eq(debtInterestPeriods.id, periodId));
    }

    return NextResponse.json({ success: true, status: responseStatus });
  } catch (error) {
    console.error('Error updating debt interest period:', error);
    return NextResponse.json(
      { error: 'Failed to update borrowing payment period' },
      { status: 500 },
    );
  }
}
