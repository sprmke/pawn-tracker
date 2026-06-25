import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts } from '@/db/schema';
import { auth } from '@/auth';
import { parseDebtBody } from '@/lib/debt-api';
import { syncDebtInterestPeriods } from '@/lib/debt-interest-period-sync';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const investorIdParam = searchParams.get('investorId');

    const investorRecord = await db.query.investors.findFirst({
      where: (investors, { eq }) => eq(investors.investorUserId, userId),
    });

    let allDebts;
    if (investorIdParam) {
      allDebts = await db.query.debts.findMany({
        where: (debts, { eq, and }) =>
          and(
            eq(debts.userId, userId),
            eq(debts.investorId, parseInt(investorIdParam)),
          ),
        orderBy: (debts, { desc }) => [desc(debts.date)],
        with: { investor: true },
      });
    } else if (investorRecord) {
      allDebts = await db.query.debts.findMany({
        where: (debts, { eq, or }) =>
          or(
            eq(debts.userId, userId),
            eq(debts.investorId, investorRecord.id),
          ),
        orderBy: (debts, { desc }) => [desc(debts.date)],
        with: { investor: true },
      });
    } else {
      allDebts = await db.query.debts.findMany({
        where: (debts, { eq }) => eq(debts.userId, userId),
        orderBy: (debts, { desc }) => [desc(debts.date)],
        with: { investor: true },
      });
    }

    return NextResponse.json(allDebts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrowings' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const debtData = {
      ...parseDebtBody(body),
      userId,
    };

    const newDebt = await db.insert(debts).values(debtData).returning();
    await syncDebtInterestPeriods(newDebt[0].id);

    return NextResponse.json(newDebt[0], { status: 201 });
  } catch (error) {
    console.error('Error creating debt:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create borrowing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
