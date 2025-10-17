import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, investors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allLoans = await db.query.loans.findMany({
      with: {
        loanInvestors: {
          with: {
            investor: true,
          },
        },
      },
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
    });
    return NextResponse.json(allLoans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loanData, investorData } = body;

    console.log('Received loan data:', loanData);
    console.log('Received investor data:', investorData);

    // Convert date strings to Date objects and ensure proper types
    const processedLoanData = {
      loanName: loanData.loanName,
      type: loanData.type,
      status: loanData.status,
      principalAmount: String(loanData.principalAmount),
      defaultInterestRate: String(loanData.defaultInterestRate),
      dueDate: new Date(loanData.dueDate),
      isMonthlyInterest: Boolean(loanData.isMonthlyInterest),
      freeLotSqm: loanData.freeLotSqm ? Number(loanData.freeLotSqm) : null,
      notes: loanData.notes || null,
    };

    console.log('Processed loan data:', processedLoanData);

    // Insert loan
    const newLoan = await db
      .insert(loans)
      .values(processedLoanData)
      .returning();
    console.log('Loan inserted:', newLoan);
    const loanId = newLoan[0].id;

    // Insert loan investors with proper date conversion
    const loanInvestorData = investorData.map((inv: any) => ({
      loanId,
      investorId: Number(inv.investorId),
      amount: String(inv.amount),
      interestRate: String(inv.interestRate),
      sentDate: new Date(inv.sentDate),
    }));

    console.log('Loan investor data:', loanInvestorData);

    await db.insert(loanInvestors).values(loanInvestorData);
    console.log('Loan investors inserted');

    // Fetch the complete loan with investors
    const completeLoan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        loanInvestors: {
          with: {
            investor: true,
          },
        },
      },
    });

    console.log('Complete loan fetched:', completeLoan);

    return NextResponse.json(completeLoan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to create loan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
