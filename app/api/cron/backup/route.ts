import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { Resend } from 'resend';
import { fetchBackupDataForUser } from '@/lib/backup-data';

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface BackupSummary {
  totalInvestors: number;
  totalLoans: number;
  totalTransactions: number;
  activeLoans: number;
  completedLoans: number;
  overdueLoans: number;
  totalLoanInvestors: number;
  totalInterestPeriods: number;
  totalReceivedPayments: number;
}

/**
 * GET /api/cron/backup
 * Cron endpoint for automated daily backups
 * Sends backup data via email using Resend
 *
 * To enable email backups:
 * 1. Sign up at https://resend.com (free tier: 3000 emails/month)
 * 2. Add RESEND_API_KEY to your environment variables
 * 3. Add BACKUP_EMAIL to specify where backups should be sent
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel sets this automatically for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get all admin users to backup their data
    const adminUsers = await db.query.users.findMany({
      where: eq(users.role, 'admin'),
    });

    if (adminUsers.length === 0) {
      return NextResponse.json({
        message: 'No admin users found',
        timestamp: new Date().toISOString(),
      });
    }

    const backupResults = [];

    for (const user of adminUsers) {
      const payload = await fetchBackupDataForUser({
        userId: user.id,
        exportedByLabel: user.email ?? user.id,
      });

      const loansForStats = payload.data.loans as Array<{
        status: string;
      }>;

      const summary: BackupSummary = {
        totalInvestors: payload.summary.totalInvestors,
        totalLoans: payload.summary.totalLoans,
        totalTransactions: payload.summary.totalTransactions,
        activeLoans: loansForStats.filter(
          (l) => l.status === 'Fully Funded' || l.status === 'Partially Funded',
        ).length,
        completedLoans: loansForStats.filter((l) => l.status === 'Completed')
          .length,
        overdueLoans: loansForStats.filter((l) => l.status === 'Overdue')
          .length,
        totalLoanInvestors: payload.summary.totalLoanInvestors,
        totalInterestPeriods: payload.summary.totalInterestPeriods,
        totalReceivedPayments: payload.summary.totalReceivedPayments,
      };

      const backupData = {
        ...payload,
        type: 'automated-daily-backup',
        summary,
      };

      // Send email if Resend is configured
      const backupEmail = process.env.BACKUP_EMAIL || user.email;

      if (resend && backupEmail) {
        try {
          const filename = `pawn-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
          const jsonContent = JSON.stringify(backupData, null, 2);
          const base64Content = Buffer.from(jsonContent).toString('base64');

          await resend.emails.send({
            from:
              process.env.RESEND_FROM_EMAIL ||
              'Pawn Tracker <onboarding@resend.dev>',
            to: backupEmail,
            subject: `📦 Pawn Tracker Daily Backup - ${format(new Date(), 'MMM dd, yyyy')}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Daily Backup Summary</h2>
                <p style="color: #666;">Your automated daily backup has been created.</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">Backup Summary</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Investors</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${summary.totalInvestors}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Total Loans</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${summary.totalLoans}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Active Loans</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #22c55e;">${summary.activeLoans}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Completed Loans</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #3b82f6;">${summary.completedLoans}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Overdue Loans</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ef4444;">${summary.overdueLoans}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Transactions</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${summary.totalTransactions}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Loan–investor rows</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${summary.totalLoanInvestors}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Interest periods</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${summary.totalInterestPeriods}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Received payments</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${summary.totalReceivedPayments}</td>
                    </tr>
                  </table>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  The full backup file is attached to this email as a JSON file. 
                  Keep this file safe - it contains all your data and can be used for restoration.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="color: #999; font-size: 12px;">
                  This is an automated backup from Pawn Tracker.<br>
                  Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            `,
            attachments: [
              {
                filename,
                content: base64Content,
              },
            ],
          });

          backupResults.push({
            userId: user.id,
            email: backupEmail,
            status: 'sent',
            summary,
          });
        } catch (emailError) {
          console.error('Error sending backup email:', emailError);
          backupResults.push({
            userId: user.id,
            email: backupEmail,
            status: 'email_failed',
            error:
              emailError instanceof Error
                ? emailError.message
                : 'Unknown error',
            summary,
          });
        }
      } else {
        backupResults.push({
          userId: user.id,
          email: user.email,
          status: 'skipped',
          reason: !resend ? 'Resend not configured' : 'No backup email',
          summary,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: backupResults,
    });
  } catch (error) {
    console.error('Error in cron backup:', error);
    return NextResponse.json(
      {
        error: 'Failed to run backup cron',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
