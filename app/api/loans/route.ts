import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, investors, interestPeriods } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateLoanTransactions } from '@/lib/loan-transactions';
import {
  generateLoanCalendarEvents,
  updateDailySummaryEvents,
  getAffectedDatesFromLoan,
} from '@/lib/google-calendar';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get loans created by this user
    const ownedLoans = await db.query.loans.findMany({
      where: eq(loans.userId, session.user.id),
      with: {
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
          },
        },
        transactions: {
          orderBy: (transactions, { asc }) => [asc(transactions.date)],
        },
      },
    });

    // Get loans where this user is an investor
    const investorRecord = await db.query.investors.findFirst({
      where: eq(investors.investorUserId, session.user.id),
    });

    let sharedLoans: any[] = [];
    if (investorRecord) {
      const loanInvestments = await db.query.loanInvestors.findMany({
        where: eq(loanInvestors.investorId, investorRecord.id),
        with: {
          loan: {
            with: {
              loanInvestors: {
                with: {
                  investor: true,
                  interestPeriods: true,
                },
              },
              transactions: {
                orderBy: (transactions, { asc }) => [asc(transactions.date)],
              },
            },
          },
        },
      });
      sharedLoans = loanInvestments.map(li => li.loan);
    }

    // Combine and deduplicate loans
    const allLoansMap = new Map();
    [...ownedLoans, ...sharedLoans].forEach(loan => {
      allLoansMap.set(loan.id, loan);
    });

    const allLoans = Array.from(allLoansMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { loanData, investorData } = body;

    console.log('Received loan data:', loanData);
    console.log('Received investor data:', investorData);

    // Convert date strings to Date objects and ensure proper types
    const processedLoanData = {
      userId: session.user.id,
      loanName: loanData.loanName,
      type: loanData.type,
      status: loanData.status,
      dueDate: new Date(loanData.dueDate),
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
      interestRate: inv.interestRate ? String(inv.interestRate) : '0',
      // Explicitly check for 'fixed' to ensure proper enum value is saved
      interestType: inv.interestType === 'fixed' ? 'fixed' : 'rate',
      sentDate: new Date(inv.sentDate),
      isPaid: inv.isPaid ?? true, // Default to true for backward compatibility
      hasMultipleInterest: inv.hasMultipleInterest || false,
    }));

    console.log('Loan investor data:', loanInvestorData);

    const insertedLoanInvestors = await db
      .insert(loanInvestors)
      .values(loanInvestorData)
      .returning();
    console.log('Loan investors inserted');

    // Insert interest periods if any
    // Group by investor to avoid inserting periods multiple times for the same investor
    const processedInvestors = new Set<number>();

    for (let i = 0; i < investorData.length; i++) {
      const inv = investorData[i];
      const investorId = Number(inv.investorId);

      // Only insert interest periods once per investor (skip if already processed)
      if (
        !processedInvestors.has(investorId) &&
        inv.hasMultipleInterest &&
        inv.interestPeriods &&
        inv.interestPeriods.length > 0
      ) {
        const loanInvestorId = insertedLoanInvestors[i].id;
        const periodData = inv.interestPeriods.map((period: any) => ({
          loanInvestorId,
          dueDate: new Date(period.dueDate),
          interestRate: String(period.interestRate),
          // Explicitly check for 'fixed' to ensure proper enum value is saved
          interestType: period.interestType === 'fixed' ? 'fixed' : 'rate',
        }));

        await db.insert(interestPeriods).values(periodData);
        console.log(
          'Interest periods inserted for loan investor:',
          loanInvestorId
        );

        processedInvestors.add(investorId);
      }
    }

    // Fetch the complete loan with investors
    const completeLoan = await db.query.loans.findFirst({
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

    console.log('Complete loan fetched:', completeLoan);

    // Generate transactions for the loan
    try {
      await generateLoanTransactions(
        {
          loanName: processedLoanData.loanName,
          dueDate: processedLoanData.dueDate,
        },
        investorData.map((inv: any, index: number) => ({
          investorId: Number(inv.investorId),
          amount: String(inv.amount),
          sentDate: new Date(inv.sentDate),
          interestRate: String(inv.interestRate),
          // Explicitly check for 'fixed' to ensure proper enum value is used
          interestType: inv.interestType === 'fixed' ? 'fixed' : 'rate',
          hasMultipleInterest: inv.hasMultipleInterest || false,
          interestPeriods: inv.interestPeriods?.map((period: any) => ({
            dueDate: new Date(period.dueDate),
            interestRate: String(period.interestRate),
            // Explicitly check for 'fixed' to ensure proper enum value is used
            interestType: period.interestType === 'fixed' ? 'fixed' : 'rate',
          })),
        })),
        loanId,
        session.user.id
      );
      console.log('Transactions created for loan');
    } catch (error) {
      console.error('Error creating transactions for loan:', error);
      // Don't fail the loan creation if transaction creation fails
    }

    // Generate Google Calendar events for this loan only
    try {
      if (completeLoan) {
        const calendarEventIds = await generateLoanCalendarEvents(completeLoan);
        if (calendarEventIds.length > 0) {
          await db
            .update(loans)
            .set({ googleCalendarEventIds: calendarEventIds })
            .where(eq(loans.id, loanId));
          console.log('Calendar events created for loan:', calendarEventIds);
        }

        // Update daily summary events for affected dates
        const affectedDates = getAffectedDatesFromLoan(completeLoan);
        // Fetch all loans to calculate correct daily totals
        const allLoans = await db.query.loans.findMany({
          where: eq(loans.userId, session.user.id),
          with: {
            loanInvestors: {
              with: {
                investor: true,
                interestPeriods: true,
              },
            },
          },
        });
        await updateDailySummaryEvents(affectedDates, allLoans);
        console.log('Daily summary events updated for affected dates');
      }
    } catch (error) {
      console.error('Error creating calendar events for loan:', error);
      // Don't fail the loan creation if calendar event creation fails
    }

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
