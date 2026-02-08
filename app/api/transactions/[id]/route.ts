import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { hasTransactionAccess } from '@/lib/access-control';

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

    // Check if user has access to this transaction
    const hasAccess = await hasTransactionAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        investor: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
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

    // Check if user has access to this transaction
    const hasAccess = await hasTransactionAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Check if transaction exists and get its type
    const existingTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Prevent editing loan transactions
    if (existingTransaction.type === 'Loan') {
      return NextResponse.json(
        {
          error:
            'Loan transactions cannot be edited directly. Please edit the loan instead.',
        },
        { status: 403 },
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
      .where(
        and(eq(transactions.id, id), eq(transactions.userId, session.user.id)),
      )
      .returning();

    if (updatedTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedTransaction[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
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

    // Check if user has access to this transaction
    const hasAccess = await hasTransactionAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Get transaction details before deletion
    const transactionToDelete = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!transactionToDelete) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    const deletedTransaction = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();

    if (deletedTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 },
    );
  }
}
