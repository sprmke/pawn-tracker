import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  debtInterestPeriods,
  debtReceivedPayments,
} from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
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
    const paymentId = parseInt(id, 10);
    if (!Number.isFinite(paymentId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const parsedAmount = parseFloat(String(body.amount ?? ''));
    const dateStr = String(body.receivedDate ?? '').trim();

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

    const payment = await db.query.debtReceivedPayments.findFirst({
      where: eq(debtReceivedPayments.id, paymentId),
      with: {
        debtInterestPeriod: {
          with: { debt: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Received payment not found' },
        { status: 404 },
      );
    }

    const period = payment.debtInterestPeriod;
    const hasAccess = await hasDebtAccess(period.debtId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const others = await db.query.debtReceivedPayments.findMany({
      where: and(
        eq(debtReceivedPayments.debtInterestPeriodId, period.id),
        ne(debtReceivedPayments.id, paymentId),
      ),
    });
    const otherSum = others.reduce(
      (sum, row) => sum + (parseFloat(row.amount) || 0),
      0,
    );
    const newTotal = otherSum + parsedAmount;
    const expectedAmount = parseFloat(period.expectedInterest) || 0;

    if (newTotal > expectedAmount + DEBT_AMOUNT_TOLERANCE) {
      return NextResponse.json(
        {
          error: `Amount would exceed the payment due for this period (${expectedAmount.toFixed(2)}). Maximum for this line: ${(expectedAmount - otherSum).toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    await db
      .update(debtReceivedPayments)
      .set({
        amount: String(parsedAmount),
        receivedDate: receivedDateObj,
        updatedAt: new Date(),
      })
      .where(eq(debtReceivedPayments.id, paymentId));

    await recalculateDebtInterestPeriodStatus(period.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating debt received payment:', error);
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

    const payment = await db.query.debtReceivedPayments.findFirst({
      where: eq(debtReceivedPayments.id, paymentId),
      with: {
        debtInterestPeriod: {
          with: { debt: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Received payment not found' },
        { status: 404 },
      );
    }

    const period = payment.debtInterestPeriod;
    const hasAccess = await hasDebtAccess(period.debtId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .delete(debtReceivedPayments)
      .where(eq(debtReceivedPayments.id, paymentId));

    await recalculateDebtInterestPeriodStatus(period.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt received payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete received payment' },
      { status: 500 },
    );
  }
}
