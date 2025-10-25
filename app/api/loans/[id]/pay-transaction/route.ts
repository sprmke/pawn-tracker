import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loanInvestors, loans } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = parseInt(params.id);
    const { transactionId } = await request.json();

    if (isNaN(loanId) || !transactionId) {
      return NextResponse.json(
        { error: 'Invalid loan ID or transaction ID' },
        { status: 400 }
      );
    }

    // Update the transaction's sent date to today
    await db
      .update(loanInvestors)
      .set({ sentDate: new Date() })
      .where(
        and(
          eq(loanInvestors.id, transactionId),
          eq(loanInvestors.loanId, loanId)
        )
      );

    // Check if there are any remaining unpaid transactions (future dates)
    const unpaidTransactions = await db
      .select()
      .from(loanInvestors)
      .where(
        and(
          eq(loanInvestors.loanId, loanId),
          gt(loanInvestors.sentDate, new Date())
        )
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
