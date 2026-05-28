import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, interestPeriods } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { hasLoanAccess } from '@/lib/access-control';

function safeParseFloat(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

function calculateInterestAmount(
  amount: number,
  interestRate: string,
  interestType: string,
): number {
  const rateValue = safeParseFloat(interestRate);
  return interestType === 'fixed' ? rateValue : amount * (rateValue / 100);
}

interface EntryPayload {
  dueDate: string;
  totalAmount: number;
  originalAmount: number;
}

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
    const loanId = parseInt(id);
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const hasAccess = await hasLoanAccess(loanId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Keep status as Overdue (do not update the original due date)
    await db
      .update(loans)
      .set({
        status: 'Overdue',
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId));

    // Group loan investors by investor ID
    const investorGroups = new Map<
      number,
      (typeof loan.loanInvestors)[number][]
    >();
    loan.loanInvestors.forEach((li) => {
      const existing = investorGroups.get(li.investor.id) || [];
      existing.push(li);
      investorGroups.set(li.investor.id, existing);
    });

    const totalPrincipal = loan.loanInvestors.reduce(
      (sum, li) => sum + safeParseFloat(li.amount),
      0,
    );

    const now = new Date();

    for (const [, transactions] of investorGroups) {
      const investorCapital = transactions.reduce(
        (sum, t) => sum + safeParseFloat(t.amount),
        0,
      );

      const primaryLoanInvestor = transactions[0];

      // Determine base rate from last period or investor-level
      const transactionWithPeriods = transactions.find(
        (t) =>
          t.hasMultipleInterest &&
          t.interestPeriods &&
          t.interestPeriods.length > 0,
      );

      let baseRate: string;
      let baseType: string;

      if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
        const sortedPeriods = [...transactionWithPeriods.interestPeriods].sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
        const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
        baseRate = lastPeriod.interestRate;
        baseType = lastPeriod.interestType;
      } else {
        baseRate = primaryLoanInvestor.interestRate;
        baseType = primaryLoanInvestor.interestType;
      }

      // Compute per-investor interest at original rates
      const base = investorCapital === 0 ? totalPrincipal : investorCapital;
      const originalInvestorInterest = calculateInterestAmount(
        base,
        baseRate,
        baseType,
      );

      // If single-interest, convert to multiple interest and add original period
      if (!primaryLoanInvestor.hasMultipleInterest) {
        await db
          .update(loanInvestors)
          .set({ hasMultipleInterest: true })
          .where(eq(loanInvestors.id, primaryLoanInvestor.id));

        await db.insert(interestPeriods).values({
          loanInvestorId: primaryLoanInvestor.id,
          dueDate: new Date(loan.dueDate),
          interestRate: baseRate,
          interestType: baseType as 'rate' | 'fixed',
          status: 'Overdue',
        });
      }

      // Build new periods from entries
      const newPeriods = (entries as EntryPayload[]).map((entry) => {
        const isEdited =
          Math.abs(entry.totalAmount - entry.originalAmount) > 0.01;

        let periodRate: string;
        let periodType: string;

        if (isEdited && entry.originalAmount > 0) {
          const scaleFactor = entry.totalAmount / entry.originalAmount;
          const adjustedAmount = originalInvestorInterest * scaleFactor;
          periodRate = adjustedAmount.toFixed(2);
          periodType = 'fixed';
        } else {
          periodRate = baseRate;
          periodType = baseType;
        }

        const periodDate = new Date(entry.dueDate);
        const status = periodDate <= now ? 'Overdue' : 'Pending';

        return {
          loanInvestorId: primaryLoanInvestor.id,
          dueDate: periodDate,
          interestRate: periodRate,
          interestType: periodType as 'rate' | 'fixed',
          status: status as 'Pending' | 'Completed' | 'Overdue',
        };
      });

      if (newPeriods.length > 0) {
        await db.insert(interestPeriods).values(newPeriods);
      }
    }

    // Fetch and return updated loan
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
    console.error('Error extending interest:', error);
    return NextResponse.json(
      {
        error: 'Failed to extend interest',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
