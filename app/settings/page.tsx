import {
  PageHeader,
  DownloadBackupButton,
  FixReceivedPaymentsButton,
  SyncLoanDueDatesButton,
} from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCachedAuth } from '@/auth';

export default async function SettingsPage() {
  const session = await getCachedAuth();
  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Settings"
        description="Maintenance tools and data exports for your workspace."
      />

      <Card>
        <CardHeader>
          <CardTitle>Data & maintenance</CardTitle>
          <CardDescription className="max-w-3xl">
            Fix Payments is the one maintenance action for bad totals or period history: it
            inserts missing received-payment rows for completed interest periods (so total
            received is not stuck at zero) and removes legacy orphan rows for multi-interest
            loans. It restores period links before deleting anything. The old “Fix Stale
            Payments” control called the same repair; you do not need a separate button.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <SyncLoanDueDatesButton />
          <FixReceivedPaymentsButton />
          <DownloadBackupButton />
        </CardContent>
      </Card>
    </div>
  );
}
