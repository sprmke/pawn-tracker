import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, loanInvestors, interestPeriods } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import {
  generateLoanTransactions,
  deleteLoanTransactions,
  recalculateInvestorBalances,
  updateLoanTransactionCounters,
} from '@/lib/loan-transactions';
import {
  generateLoanCalendarEvents,
  deleteMultipleCalendarEvents,
  updateDailySummaryEvents,
  getAffectedDatesFromLoan,
} from '@/lib/google-calendar';
import { hasLoanAccess } from '@/lib/access-control';
import { requiresTransactionRegeneration } from '@/lib/loan-update-detector';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = parseInt(id);

    // Check if user has access to this loan
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = parseInt(id);
    const body = await request.json();
    const { loanData, investorData } = body;

    console.log('Updating loan:', loanId);
    console.log('Received loan data:', loanData);
    console.log('Received investor data:', investorData);

    // Verify access
    const hasAccess = await hasLoanAccess(loanId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const existingLoan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        loanInvestors: {
          with: {
            interestPeriods: true,
          },
        },
      },
    });

    if (!existingLoan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

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

    // Prepare existing and new investor data for comparison
    const existingInvestorData = existingLoan.loanInvestors.map((li) => ({
      investorId: li.investorId,
      amount: li.amount,
      sentDate: li.sentDate,
      interestRate: li.interestRate,
      interestType: li.interestType,
      hasMultipleInterest: li.hasMultipleInterest,
      interestPeriods: li.interestPeriods?.map((period) => ({
        dueDate: period.dueDate,
        interestRate: period.interestRate,
        interestType: period.interestType,
      })),
    }));

    const newInvestorData = investorData.map((inv: any) => ({
      investorId: Number(inv.investorId),
      amount: String(inv.amount),
      sentDate: new Date(inv.sentDate),
      interestRate: String(inv.interestRate || '0'),
      interestType: inv.interestType || 'rate',
      hasMultipleInterest: inv.hasMultipleInterest || false,
      interestPeriods: inv.interestPeriods?.map((period: any) => ({
        dueDate: new Date(period.dueDate),
        interestRate: String(period.interestRate),
        interestType: period.interestType || 'rate',
      })),
    }));

    // Check if transaction regeneration is needed
    const needsTransactionRegeneration = requiresTransactionRegeneration(
      {
        loanName: existingLoan.loanName,
        type: existingLoan.type,
        status: existingLoan.status,
        dueDate: existingLoan.dueDate,
        freeLotSqm: existingLoan.freeLotSqm,
        notes: existingLoan.notes,
      },
      processedLoanData,
      existingInvestorData,
      newInvestorData
    );

    console.log(
      'Transaction regeneration needed:',
      needsTransactionRegeneration
    );

    // Update loan
    await db
      .update(loans)
      .set(processedLoanData)
      .where(and(eq(loans.id, loanId), eq(loans.userId, session.user.id)));

    // Only delete and regenerate transactions if computational fields changed
    let affectedInvestorIds: number[] = [];
    let earliestDate: Date | null = null;

    if (needsTransactionRegeneration) {
      // Delete existing transactions for this loan and get affected investors
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

      // Fetch existing interest periods before deleting (to preserve completed statuses)
      const existingLoanInvestors = await db.query.loanInvestors.findMany({
        where: eq(loanInvestors.loanId, loanId),
        with: {
          interestPeriods: true,
        },
      });

      // Create a map of existing periods by investor and due date for easy lookup
      const existingPeriodsMap = new Map<
        string,
        { status: string; interestRate: string; interestType: string }
      >();
      existingLoanInvestors.forEach((li) => {
        if (li.interestPeriods) {
          li.interestPeriods.forEach((period) => {
            const key = `${li.investorId}-${period.dueDate.toISOString()}`;
            existingPeriodsMap.set(key, {
              status: period.status,
              interestRate: period.interestRate,
              interestType: period.interestType,
            });
          });
        }
      });

      // Delete existing loan investors (cascade will delete interest periods)
      await db.delete(loanInvestors).where(eq(loanInvestors.loanId, loanId));

      // Insert updated loan investors
      if (investorData && investorData.length > 0) {
        const loanInvestorData = investorData.map((inv: any) => ({
          loanId,
          investorId: Number(inv.investorId),
          amount: String(inv.amount),
          interestRate: inv.interestRate ? String(inv.interestRate) : '0',
          interestType: inv.interestType || 'rate',
          sentDate: new Date(inv.sentDate),
          isPaid: inv.isPaid ?? true, // Default to true for backward compatibility
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
            const periodData = inv.interestPeriods.map((period: any) => {
              const dueDate = new Date(period.dueDate);
              const newInterestRate = String(period.interestRate);
              const newInterestType = period.interestType || 'rate';

              // Check if this period existed before with same date/rate
              const key = `${investorId}-${dueDate.toISOString()}`;
              const existingPeriod = existingPeriodsMap.get(key);

              // Preserve completed status only if date and rate haven't changed
              let status: 'Pending' | 'Completed' | 'Overdue' = 'Pending';
              if (existingPeriod) {
                const rateChanged =
                  existingPeriod.interestRate !== newInterestRate;
                const typeChanged =
                  existingPeriod.interestType !== newInterestType;

                // If nothing changed and it was completed, keep it completed
                if (
                  !rateChanged &&
                  !typeChanged &&
                  existingPeriod.status === 'Completed'
                ) {
                  status = 'Completed';
                } else if (
                  existingPeriod.status === 'Overdue' &&
                  !rateChanged &&
                  !typeChanged
                ) {
                  // Also preserve Overdue status if rate/type unchanged
                  status = 'Overdue';
                }
              }

              return {
                loanInvestorId,
                dueDate,
                interestRate: newInterestRate,
                interestType: newInterestType,
                status,
              };
            });

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
    } else {
      console.log(
        'Skipping loan investor deletion/recreation - no computational changes detected'
      );
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

    // Generate new transactions only if computational fields changed
    if (needsTransactionRegeneration) {
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
          loanId,
          session.user.id
        );
        console.log('New transactions created for updated loan');
      } catch (error) {
        console.error('Error creating transactions for updated loan:', error);
      }
    } else {
      // If only non-computational fields changed (like loan name), update transaction names
      if (processedLoanData.loanName !== existingLoan.loanName) {
        try {
          await updateLoanTransactionCounters(
            loanId,
            processedLoanData.loanName
          );
          console.log('Updated transaction names for loan');
        } catch (error) {
          console.error('Error updating transaction names:', error);
        }
      } else {
        console.log(
          'Skipped transaction regeneration - only non-computational fields changed'
        );
      }
    }

    // Update Google Calendar events for THIS loan only
    try {
      // Delete existing calendar events for this loan
      const existingEventIds = existingLoan.googleCalendarEventIds as string[] | null;
      if (existingEventIds && existingEventIds.length > 0) {
        await deleteMultipleCalendarEvents(existingEventIds);
        console.log('Deleted existing calendar events for loan');
      }

      // Generate new calendar events for this loan
      if (updatedLoan) {
        const calendarEventIds = await generateLoanCalendarEvents(updatedLoan);
        if (calendarEventIds.length > 0) {
          await db
            .update(loans)
            .set({ googleCalendarEventIds: calendarEventIds })
            .where(eq(loans.id, loanId));
          console.log('Calendar events updated for loan:', calendarEventIds);
        }

        // Update daily summary events for affected dates
        // Get affected dates from both the old and updated loan to handle date changes
        const oldAffectedDates = getAffectedDatesFromLoan({
          ...existingLoan,
          loanInvestors: existingLoan.loanInvestors.map((li) => ({
            ...li,
            investor: { id: li.investorId, name: '' } as any,
          })),
        } as any);
        const newAffectedDates = getAffectedDatesFromLoan(updatedLoan);

        // Combine and deduplicate affected dates
        const allAffectedDates = [...oldAffectedDates];
        const dateSet = new Set(
          oldAffectedDates.map((d) => d.toISOString().split('T')[0])
        );
        for (const date of newAffectedDates) {
          const dateKey = date.toISOString().split('T')[0];
          if (!dateSet.has(dateKey)) {
            dateSet.add(dateKey);
            allAffectedDates.push(date);
          }
        }

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
        await updateDailySummaryEvents(allAffectedDates, allLoans);
        console.log('Daily summary events updated for affected dates');
      }
    } catch (error) {
      console.error('Error updating calendar events for loan:', error);
      // Don't fail the loan update if calendar event update fails
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = parseInt(id);

    // Verify access
    const hasAccess = await hasLoanAccess(loanId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Fetch complete loan data (including investors) BEFORE deletion for calendar updates
    const existingLoan = await db.query.loans.findFirst({
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

    if (!existingLoan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Get affected dates BEFORE deletion
    const affectedDates = getAffectedDatesFromLoan(existingLoan);

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
    await db
      .delete(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, session.user.id)));

    // Delete Google Calendar events for this loan
    try {
      const existingEventIds = existingLoan.googleCalendarEventIds as string[] | null;
      if (existingEventIds && existingEventIds.length > 0) {
        await deleteMultipleCalendarEvents(existingEventIds);
        console.log('Deleted calendar events for loan');
      }

      // Update daily summary events for affected dates (already calculated before deletion)
      // Fetch all remaining loans to calculate correct daily totals
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
      console.log('Daily summary events updated for affected dates after deletion');
    } catch (error) {
      console.error('Error deleting calendar events:', error);
      // Don't fail the loan deletion if calendar event deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}
