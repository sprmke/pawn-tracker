import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { hasDebtAccess } from '@/lib/access-control';
import { parseDebtBody } from '@/lib/debt-api';
import {
  markOverdueDebtInterestPeriods,
  syncDebtInterestPeriods,
} from '@/lib/debt-interest-period-sync';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const hasAccess = await hasDebtAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const debt = await db.query.debts.findFirst({
      where: eq(debts.id, id),
      with: {
        investor: true,
        interestPeriods: {
          with: { receivedPayments: true },
          orderBy: (periods, { asc }) => [asc(periods.periodNumber)],
        },
      },
    });

    if (!debt) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    if (!debt.interestPeriods?.length) {
      await syncDebtInterestPeriods(id);
    } else {
      await markOverdueDebtInterestPeriods(id);
    }

    const debtWithPeriods = await db.query.debts.findFirst({
      where: eq(debts.id, id),
      with: {
        investor: true,
        interestPeriods: {
          with: { receivedPayments: true },
          orderBy: (periods, { asc }) => [asc(periods.periodNumber)],
        },
      },
    });

    return NextResponse.json(debtWithPeriods);
  } catch (error) {
    console.error('Error fetching debt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrowing' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    const hasAccess = await hasDebtAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const existingDebt = await db.query.debts.findFirst({
      where: eq(debts.id, id),
    });

    if (!existingDebt) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const debtData = {
      ...parseDebtBody(body),
      updatedAt: new Date(),
    };

    const updatedDebt = await db
      .update(debts)
      .set(debtData)
      .where(and(eq(debts.id, id), eq(debts.userId, session.user.id)))
      .returning();

    if (updatedDebt.length === 0) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    await syncDebtInterestPeriods(id);

    const debtWithPeriods = await db.query.debts.findFirst({
      where: eq(debts.id, id),
      with: {
        investor: true,
        interestPeriods: {
          with: { receivedPayments: true },
          orderBy: (periods, { asc }) => [asc(periods.periodNumber)],
        },
      },
    });

    return NextResponse.json(debtWithPeriods);
  } catch (error) {
    console.error('Error updating debt:', error);
    return NextResponse.json(
      { error: 'Failed to update borrowing' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const hasAccess = await hasDebtAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const deletedDebt = await db
      .delete(debts)
      .where(eq(debts.id, id))
      .returning();

    if (deletedDebt.length === 0) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json(
      { error: 'Failed to delete borrowing' },
      { status: 500 },
    );
  }
}
