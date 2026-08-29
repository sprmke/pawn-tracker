import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { loanInvestors, loans } from '@/db/schema';
import { hasLoanAccess } from '@/lib/access-control';
import { invalidateLoanData } from '@/lib/cache-invalidation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = Number.parseInt(id, 10);
    if (!Number.isFinite(loanId)) {
      return NextResponse.json({ error: 'Invalid loan ID.' }, { status: 400 });
    }
    if (!(await hasLoanAccess(loanId, session.user.id))) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const body = await request.json();
    const investorId = Number.parseInt(String(body.investorId), 10);
    const amount = Number.parseFloat(String(body.amount));
    const interestType = body.interestType === 'fixed' ? 'fixed' : 'rate';
    const interestValue = Number.parseFloat(String(body.interestValue ?? 0));
    const sentDate = new Date(String(body.sentDate ?? ''));
    const isPaid = body.isPaid !== false;

    if (!Number.isFinite(investorId)) {
      return NextResponse.json(
        { error: 'Select a lender for this payment.' },
        { status: 400 },
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Enter an amount greater than zero.' },
        { status: 400 },
      );
    }
    if (Number.isNaN(sentDate.getTime())) {
      return NextResponse.json(
        { error: 'A valid sent date is required.' },
        { status: 400 },
      );
    }
    if (!Number.isFinite(interestValue) || interestValue < 0) {
      return NextResponse.json(
        { error: 'Interest cannot be negative.' },
        { status: 400 },
      );
    }

    const existingPayments = await db.query.loanInvestors.findMany({
      where: and(
        eq(loanInvestors.loanId, loanId),
        eq(loanInvestors.investorId, investorId),
      ),
      with: { interestPeriods: true },
    });
    if (!existingPayments.length) {
      return NextResponse.json(
        { error: 'The selected lender is not assigned to this loan.' },
        { status: 400 },
      );
    }

    const sentDay = sentDate.toISOString().slice(0, 10);
    const duplicateDate = existingPayments.some(
      (payment) => payment.sentDate.toISOString().slice(0, 10) === sentDay,
    );
    if (duplicateDate) {
      return NextResponse.json(
        {
          error:
            'This lender already has a principal payment on the selected date.',
        },
        { status: 400 },
      );
    }

    const scheduleSource = existingPayments.find(
      (payment) =>
        payment.hasMultipleInterest && payment.interestPeriods.length > 0,
    );

    await db.insert(loanInvestors).values({
      loanId,
      investorId,
      amount: String(amount),
      interestType: scheduleSource?.interestType ?? interestType,
      interestRate:
        scheduleSource?.interestRate ?? String(interestValue || 0),
      sentDate,
      isPaid,
      hasMultipleInterest: Boolean(scheduleSource),
    });

    const allPayments = await db.query.loanInvestors.findMany({
      where: eq(loanInvestors.loanId, loanId),
    });
    const hasUnpaid = allPayments.some((payment) => !payment.isPaid);
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
    });

    if (loan && loan.status !== 'Completed') {
      const nextStatus = hasUnpaid
        ? 'Partially Funded'
        : loan.status === 'Partially Funded'
          ? 'Fully Funded'
          : loan.status;
      await db
        .update(loans)
        .set({
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));
    }

    invalidateLoanData();
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding principal payment:', error);
    return NextResponse.json(
      { error: 'Failed to add principal payment.' },
      { status: 500 },
    );
  }
}
