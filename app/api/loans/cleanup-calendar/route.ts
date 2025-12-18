import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { deleteAllCalendarEvents } from '@/lib/google-calendar';

// Delete ALL events from Google Calendar (complete cleanup for fresh start)
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting COMPLETE cleanup of ALL Google Calendar events...');
    
    // Delete all events from Google Calendar
    const deletedCount = await deleteAllCalendarEvents();

    // Clear all googleCalendarEventIds from all user's loans
    await db
      .update(loans)
      .set({ googleCalendarEventIds: null })
      .where(eq(loans.userId, session.user.id));

    console.log('Cleared all calendar event IDs from loans database');

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} events from Google Calendar. Calendar is now clean.`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up calendar events:', error);
    return NextResponse.json(
      {
        error: 'Failed to cleanup calendar events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
