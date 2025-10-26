import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        investor: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    // Check if transaction exists and get its type
    const existingTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Prevent editing loan transactions
    if (existingTransaction.type === 'Loan') {
      return NextResponse.json(
        {
          error:
            'Loan transactions cannot be edited directly. Please edit the loan instead.',
        },
        { status: 403 }
      );
    }

    // Remove balance from body if present (balance should never be editable)
    const { balance, ...updateData } = body;

    // Convert ISO string date to Date object for Drizzle
    const transactionData = {
      ...updateData,
      date: new Date(updateData.date),
      updatedAt: new Date(),
    };

    const updatedTransaction = await db
      .update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, id))
      .returning();

    if (updatedTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTransaction[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const deletedTransaction = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();

    if (deletedTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
