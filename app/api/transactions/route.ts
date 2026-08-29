import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { auth } from '@/auth';
import { getCachedTransactions } from '@/lib/cached-data';
import { invalidateTransactionData } from '@/lib/cache-invalidation';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const investorIdParam = searchParams.get('investorId');

    const investorId = investorIdParam ? parseInt(investorIdParam, 10) : null;
    return NextResponse.json(await getCachedTransactions(userId, investorId));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
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

    // Convert ISO string date to Date object for Drizzle
    const transactionData = {
      ...body,
      userId,
      date: new Date(body.date),
    };

    const newTransaction = await db
      .insert(transactions)
      .values(transactionData)
      .returning();

    invalidateTransactionData();
    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 },
    );
  }
}
