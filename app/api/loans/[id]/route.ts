import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, interestPeriods } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  generateLoanTransactions,
  deleteLoanTransactions,
  recalculateInvestorBalances,
} from '@/lib/loan-transactions';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = parseInt(params.id);

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
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

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = parseInt(params.id);
    const body = await request.json();
    const { loanData, investorData } = body;

    console.log('Updating loan:', loanId);
    console.log('Received loan data:', loanData);
    console.log('Received investor data:', investorData);

    // Convert date strings to Date objects and ensure proper types
    const processedLoanData = {
      loanName: loanData.loanName,
      type: loanData.type,
      status: loanData.status,
      dueDate: new Date(loanData.dueDate),
      freeLotSqm: loanData.freeLotSqm ? Number(loanData.freeLotSqm) : null,
      notes: loanData.notes || null,
      updatedAt: new Date(),
    };

    // Update loan
    await db.update(loans).set(processedLoanData).where(eq(loans.id, loanId));

    // Delete existing transactions for this loan and get affected investors
    let affectedInvestorIds: number[] = [];
    let earliestDate: Date | null = null;
    try {
      const deletionResult = await deleteLoanTransactions(loanId);
      affectedInvestorIds = deletionResult.investorIds;
      earliestDate = deletionResult.earliestDate;
      console.log('Deleted old transactions for loan');
    } catch (error) {
      console.error('Error deleting old transactions:', error);
    }

    // Recalculate balances for affected investors after deletion
    if (affectedInvestorIds.length > 0 && earliestDate) {
      try {
        await recalculateInvestorBalances(affectedInvestorIds, earliestDate);
        console.log(
          'Recalculated balances after deletion for affected investors'
        );
      } catch (error) {
        console.error('Error recalculating balances after deletion:', error);
      }
    }

    // Delete existing loan investors (cascade will delete interest periods)
    await db.delete(loanInvestors).where(eq(loanInvestors.loanId, loanId));

    // Insert updated loan investors
    if (investorData && investorData.length > 0) {
      const loanInvestorData = investorData.map((inv: any) => ({
        loanId,
        investorId: Number(inv.investorId),
        amount: String(inv.amount),
        interestRate: String(inv.interestRate),
        interestType: inv.interestType || 'rate',
        sentDate: new Date(inv.sentDate),
        hasMultipleInterest: inv.hasMultipleInterest || false,
      }));

      const insertedLoanInvestors = await db
        .insert(loanInvestors)
        .values(loanInvestorData)
        .returning();

      // Insert interest periods if any
      // Group by investor to avoid inserting periods multiple times for the same investor
      const processedInvestors = new Set<number>();

      for (let i = 0; i < investorData.length; i++) {
        const inv = investorData[i];
        const investorId = Number(inv.investorId);

        console.log(`Processing investor ${i} (ID: ${investorId}):`, {
          hasMultipleInterest: inv.hasMultipleInterest,
          interestPeriodsLength: inv.interestPeriods?.length || 0,
          interestPeriods: inv.interestPeriods,
          alreadyProcessed: processedInvestors.has(investorId),
        });

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
            interestType: period.interestType || 'rate',
          }));

          console.log(
            'Inserting interest periods for loanInvestorId:',
            loanInvestorId,
            periodData
          );
          await db.insert(interestPeriods).values(periodData);
          console.log('Interest periods inserted successfully');

          processedInvestors.add(investorId);
        }
      }
    }

    // Fetch the updated loan with investors
    const updatedLoan = await db.query.loans.findFirst({
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

    console.log('Loan updated successfully:', updatedLoan);

    // Generate new transactions for the updated loan
    try {
      await generateLoanTransactions(
        {
          loanName: processedLoanData.loanName,
          dueDate: processedLoanData.dueDate,
        },
        investorData.map((inv: any) => ({
          investorId: Number(inv.investorId),
          amount: String(inv.amount),
          sentDate: new Date(inv.sentDate),
          interestRate: String(inv.interestRate),
          interestType: inv.interestType || 'rate',
          hasMultipleInterest: inv.hasMultipleInterest || false,
          interestPeriods: inv.interestPeriods?.map((period: any) => ({
            dueDate: new Date(period.dueDate),
            interestRate: String(period.interestRate),
            interestType: period.interestType || 'rate',
          })),
        })),
        loanId
      );
      console.log('New transactions created for updated loan');
    } catch (error) {
      console.error('Error creating transactions for updated loan:', error);
    }

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error('Error updating loan:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to update loan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = parseInt(params.id);

    // Delete associated transactions first and get affected investors
    let affectedInvestorIds: number[] = [];
    let earliestDate: Date | null = null;
    try {
      const deletionResult = await deleteLoanTransactions(loanId);
      affectedInvestorIds = deletionResult.investorIds;
      earliestDate = deletionResult.earliestDate;
      console.log('Deleted transactions for loan');
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }

    // Recalculate balances for affected investors after deletion
    if (affectedInvestorIds.length > 0 && earliestDate) {
      try {
        await recalculateInvestorBalances(affectedInvestorIds, earliestDate);
        console.log(
          'Recalculated balances after deletion for affected investors'
        );
      } catch (error) {
        console.error('Error recalculating balances after deletion:', error);
      }
    }

    // Delete loan (cascade will handle loan_investors)
    await db.delete(loans).where(eq(loans.id, loanId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}
