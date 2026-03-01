import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { hasLoanAccess } from '@/lib/access-control';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = parseInt(id);
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 },
      );
    }

    const hasAccess = await hasLoanAccess(loanId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    await db
      .update(loans)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(loans.id, loanId), eq(loans.userId, session.user.id)));

    const updatedLoan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
            receivedPayments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error('Error updating loan status:', error);
    return NextResponse.json(
      { error: 'Failed to update loan status' },
      { status: 500 },
    );
  }
}
