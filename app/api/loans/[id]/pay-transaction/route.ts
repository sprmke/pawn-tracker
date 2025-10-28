import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loanInvestors, loans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id);
    const { transactionId } = await request.json();

    if (isNaN(loanId) || !transactionId) {
      return NextResponse.json(
        { error: 'Invalid loan ID or transaction ID' },
        { status: 400 }
      );
    }

    // Update the transaction's sent date to today and mark as paid
    await db
      .update(loanInvestors)
      .set({ sentDate: new Date(), isPaid: true })
      .where(
        and(
          eq(loanInvestors.id, transactionId),
          eq(loanInvestors.loanId, loanId)
        )
      );

    // Fetch all transactions for this loan
    const allTransactions = await db
      .select()
      .from(loanInvestors)
      .where(eq(loanInvestors.loanId, loanId));

    // Check if there are any remaining unpaid transactions
    const unpaidTransactions = allTransactions.filter(
      (transaction) => !transaction.isPaid
    );

    // If no unpaid transactions remain, update loan status to "Fully Funded"
    if (unpaidTransactions.length === 0) {
      await db
        .update(loans)
        .set({ status: 'Fully Funded' })
        .where(eq(loans.id, loanId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error paying transaction:', error);
    return NextResponse.json(
      { error: 'Failed to pay transaction' },
      { status: 500 }
    );
  }
}
