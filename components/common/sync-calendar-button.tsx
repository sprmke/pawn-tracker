'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SyncCalendarButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SyncCalendarButton({
  variant = 'outline',
  size = 'default',
}: SyncCalendarButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleSync = async (e: React.MouseEvent) => {
    // Prevent the AlertDialogAction from closing the dialog
    e.preventDefault();

    try {
      setSyncing(true);
      // Keep dialog open during sync

      const response = await fetch('/api/loans/sync-calendar', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Calendar synced! ${data.successCount} loans synced successfully.`,
          {
            description:
              data.errorCount > 0
                ? `${data.errorCount} loans had errors.`
                : 'All loans synced to Google Calendar.',
          }
        );
        setShowDialog(false); // Close dialog on success
      } else {
        toast.error(data.error || 'Failed to sync calendar events', {
          description:
            data.details || 'Please check your Google Calendar configuration.',
        });
        setShowDialog(false); // Close dialog on error
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar events', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setShowDialog(false); // Close dialog on error
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        disabled={syncing}
      >
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin xl:mr-2" />
            <span className="hidden xl:inline">Syncing...</span>
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 xl:mr-2" />
            <span className="hidden xl:inline">Sync Calendar</span>
          </>
        )}
      </Button>

      <AlertDialog
        open={showDialog}
        onOpenChange={(open) => {
          // Prevent closing dialog while syncing
          if (!syncing) {
            setShowDialog(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync Loans to Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  This will sync all your loans with Google Calendar. The
                  following events will be created:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>📊 Daily summary events</li>
                  <li>📤 Disbursement events (sent dates)</li>
                  <li>📅 Due date events</li>
                  <li>💰 Interest due events (for multi-period loans)</li>
                </ul>

                {syncing && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-3 mt-3">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium mb-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Syncing in progress...</span>
                    </div>
                    <p className="text-sm text-orange-800 dark:text-orange-200 font-medium"></p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      This may take a few moments... Please do not close this
                      window or refresh the page while syncing is in progress.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={syncing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
