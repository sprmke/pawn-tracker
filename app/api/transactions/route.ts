import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const investorId = searchParams.get('investorId');

    let allTransactions;
    if (investorId) {
      allTransactions = await db.query.transactions.findMany({
        where: (transactions, { eq }) => eq(transactions.investorId, parseInt(investorId)),
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
      });
    } else {
      allTransactions = await db.query.transactions.findMany({
        orderBy: (transactions, { desc }) => [desc(transactions.date)],
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
    const body = await request.json();
    const newTransaction = await db.insert(transactions).values(body).returning();
    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

