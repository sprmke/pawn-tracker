import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { format } from 'date-fns';
import { fetchBackupDataForUser, type BackupData } from '@/lib/backup-data';

/**
 * GET /api/backup
 * Exports all business data for the signed-in user (same scope as dashboard).
 * Optional ?download=true returns a JSON file attachment.
 *
 * Note: This is an application-level export (investors, loans, loan_investors,
 * interest_periods, received_payments, transactions). It does not include
 * NextAuth tables (OAuth tokens, sessions). For a full Postgres snapshot use Neon backups / PITR.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupData: BackupData = await fetchBackupDataForUser({
      userId: session.user.id,
      exportedByLabel:
        session.user.email || session.user.name || session.user.id,
    });

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    if (download) {
      const filename = `pawn-tracker-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

      return new NextResponse(JSON.stringify(backupData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 },
    );
  }
}
