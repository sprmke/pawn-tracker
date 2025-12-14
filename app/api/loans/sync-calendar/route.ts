import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import {
  generateLoanCalendarEvents,
  generateAllLoansCalendarEvents,
  deleteMultipleCalendarEvents,
} from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { loanId, action } = body;

    if (!loanId) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    // Fetch the loan with all related data
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

    // Check if user has access to this loan
    if (loan.userId !== session.user.id) {
      // Check if user is an investor in this loan
      const isInvestor = loan.loanInvestors.some(
        (li) => li.investor.investorUserId === session.user.id
      );
      if (!isInvestor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    if (action === 'sync') {
      // Delete existing calendar events if any
      const existingEventIds = loan.googleCalendarEventIds as string[] | null;
      if (existingEventIds && existingEventIds.length > 0) {
        await deleteMultipleCalendarEvents(existingEventIds);
        console.log('Deleted existing calendar events for loan:', loanId);
      }

      // Generate new calendar events
      const calendarEventIds = await generateLoanCalendarEvents(loan);

      if (calendarEventIds.length > 0) {
        // Update loan with calendar event IDs
        await db
          .update(loans)
          .set({ googleCalendarEventIds: calendarEventIds })
          .where(eq(loans.id, loanId));

        return NextResponse.json({
          success: true,
          message: 'Calendar events synced successfully',
          eventIds: calendarEventIds,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'No calendar events were created',
        });
      }
    } else if (action === 'remove') {
      // Remove calendar events
      const existingEventIds = loan.googleCalendarEventIds as string[] | null;
      if (existingEventIds && existingEventIds.length > 0) {
        await deleteMultipleCalendarEvents(existingEventIds);

        // Clear calendar event IDs from loan
        await db
          .update(loans)
          .set({ googleCalendarEventIds: null })
          .where(eq(loans.id, loanId));

        return NextResponse.json({
          success: true,
          message: 'Calendar events removed successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'No calendar events to remove',
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "sync" or "remove"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error syncing calendar events:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync calendar events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Sync all loans for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all loans for this user
    const userLoans = await db.query.loans.findMany({
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

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Delete all existing calendar events first
    for (const loan of userLoans) {
      const existingEventIds = loan.googleCalendarEventIds as string[] | null;
      if (existingEventIds && existingEventIds.length > 0) {
        await deleteMultipleCalendarEvents(existingEventIds);
      }
    }

    // Generate new calendar events for all loans with daily summaries
    const loanEventIdsMap = await generateAllLoansCalendarEvents(userLoans);

    // Update each loan with its calendar event IDs
    for (const loan of userLoans) {
      try {
        const calendarEventIds = loanEventIdsMap.get(loan.id) || [];

        if (calendarEventIds.length > 0) {
          // Update loan with calendar event IDs
          await db
            .update(loans)
            .set({ googleCalendarEventIds: calendarEventIds })
            .where(eq(loans.id, loan.id));

          results.push({
            loanId: loan.id,
            loanName: loan.loanName,
            success: true,
            eventCount: calendarEventIds.length,
          });
          successCount++;
        } else {
          results.push({
            loanId: loan.id,
            loanName: loan.loanName,
            success: false,
            error: 'No calendar events created',
          });
          errorCount++;
        }
      } catch (error) {
        console.error(`Error syncing loan ${loan.id}:`, error);
        results.push({
          loanId: loan.id,
          loanName: loan.loanName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} loans successfully, ${errorCount} errors`,
      totalLoans: userLoans.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error('Error syncing all calendar events:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync calendar events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
