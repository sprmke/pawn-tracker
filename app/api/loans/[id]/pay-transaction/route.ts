import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loanInvestors, loans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = parseInt(id);
    const { transactionId } = await request.json();

    if (isNaN(loanId) || !transactionId) {
      return NextResponse.json(
        { error: 'Invalid loan ID or transaction ID' },
        { status: 400 }
      );
    }

    // Verify loan ownership
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, loanId), eq(loans.userId, session.user.id)),
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
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
