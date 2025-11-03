import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const investorId = searchParams.get('investorId');

    let allTransactions;
    if (investorId) {
      allTransactions = await db.query.transactions.findMany({
        where: (transactions, { eq, and }) =>
          and(
            eq(transactions.userId, session.user.id),
            eq(transactions.investorId, parseInt(investorId))
          ),
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
        with: {
          investor: true,
        },
      });
    } else {
      allTransactions = await db.query.transactions.findMany({
        where: (transactions, { eq }) =>
          eq(transactions.userId, session.user.id),
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
        with: {
          investor: true,
        },
      });
    }

    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Convert ISO string date to Date object for Drizzle
    const transactionData = {
      ...body,
      userId: session.user.id,
      date: new Date(body.date),
    };

    const newTransaction = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
