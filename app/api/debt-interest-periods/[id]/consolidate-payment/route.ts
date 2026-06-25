import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debtInterestPeriods, debtReceivedPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { hasDebtAccess } from '@/lib/access-control';
import {
  DEBT_AMOUNT_TOLERANCE,
  recalculateDebtInterestPeriodStatus,
} from '@/lib/debt-interest-period-sync';

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
    const { amount, receivedDate } = await request.json();

    const parsedAmount = parseFloat(String(amount ?? ''));
    const dateStr = String(receivedDate ?? '').trim();

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

    const period = await db.query.debtInterestPeriods.findFirst({
      where: eq(debtInterestPeriods.id, periodId),
      with: { debt: true },
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
    if (parsedAmount > expectedAmount + DEBT_AMOUNT_TOLERANCE) {
      return NextResponse.json(
        {
          error: `Amount cannot exceed the payment due for this period (${expectedAmount.toFixed(2)}).`,
        },
        { status: 400 },
      );
    }

    await db
      .delete(debtReceivedPayments)
      .where(eq(debtReceivedPayments.debtInterestPeriodId, periodId));

    await db.insert(debtReceivedPayments).values({
      debtInterestPeriodId: periodId,
      amount: String(parsedAmount),
      receivedDate: receivedDateObj,
    });

    await recalculateDebtInterestPeriodStatus(periodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error consolidating debt payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 },
    );
  }
}
