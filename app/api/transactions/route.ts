import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';
import { recalculateInvestorBalances } from '@/lib/loan-transactions';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const investorIdParam = searchParams.get('investorId');

    // Find if this user is an investor
    const investorRecord = await db.query.investors.findFirst({
      where: (investors, { eq }) => eq(investors.investorUserId, userId),
    });

    let allTransactions;
    if (investorIdParam) {
      // Filter by specific investor
      allTransactions = await db.query.transactions.findMany({
        where: (transactions, { eq, and }) =>
          and(
            eq(transactions.userId, userId),
            eq(transactions.investorId, parseInt(investorIdParam))
          ),
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
        with: {
          investor: true,
        },
      });
    } else {
      // Get all transactions (owned + shared)
      if (investorRecord) {
        // User is an investor, get transactions they created OR transactions for them
        allTransactions = await db.query.transactions.findMany({
          where: (transactions, { eq, or }) =>
            or(
              eq(transactions.userId, userId),
              eq(transactions.investorId, investorRecord.id)
            ),
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
          with: {
            investor: true,
          },
        });
      } else {
        // User is not an investor, just get their own transactions
        allTransactions = await db.query.transactions.findMany({
          where: (transactions, { eq }) => eq(transactions.userId, userId),
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
          with: {
            investor: true,
          },
        });
      }
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

    // Recalculate balances after creating new transaction
    try {
      await recalculateInvestorBalances(
        [newTransaction[0].investorId],
        newTransaction[0].date
      );
      console.log('Recalculated balances after transaction creation');
    } catch (error) {
      console.error('Error recalculating balances after creation:', error);
    }

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
