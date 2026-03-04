'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, Loader2, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
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

type DialogMode = 'sync' | 'clear' | null;

export function SyncCalendarButton({
  variant = 'outline',
  size = 'default',
}: SyncCalendarButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
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
      } else {
        toast.error(data.error || 'Failed to sync calendar events', {
          description:
            data.details || 'Please check your Google Calendar configuration.',
        });
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar events', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
      setDialogMode(null);
    }
  };

  const handleClear = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/loans/cleanup-calendar', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(
          `Cleared ${data.deletedCount} events from Google Calendar.`,
          { description: 'All loan calendar events have been removed.' }
        );
      } else {
        toast.error(data.error || 'Failed to clear calendar events', {
          description:
            data.details || 'Please check your Google Calendar configuration.',
        });
      }
    } catch (error) {
      console.error('Error clearing calendar:', error);
      toast.error('Failed to clear calendar events', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
      setDialogMode(null);
    }
  };

  const dropdownItems = [
    {
      label: 'Sync calendar events',
      onClick: () => setDialogMode('sync'),
      icon: <RefreshCw className="h-4 w-4" />,
    },
    {
      label: 'Clear calendar events',
      onClick: () => setDialogMode('clear'),
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
    },
  ];

  return (
    <>
      <DropdownMenu
        trigger={
          <Button variant={variant} size={size} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin xl:mr-2" />
                <span className="hidden xl:inline">Processing...</span>
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 xl:mr-1" />
                <ChevronDown className="h-3 w-3 hidden xl:inline" />
              </>
            )}
          </Button>
        }
        items={dropdownItems}
      />

      <AlertDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!loading) setDialogMode(open ? dialogMode : null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogMode === 'sync'
                ? 'Sync Loans to Google Calendar?'
                : 'Clear All Calendar Events?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {dialogMode === 'sync' ? (
                  <>
                    <div>
                      This will sync all your loans with Google Calendar. The
                      following events will be created:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Daily summary events</li>
                      <li>Disbursement events (sent dates)</li>
                      <li>Due date events</li>
                      <li>Interest due events (for multi-period loans)</li>
                    </ul>
                  </>
                ) : (
                  <div>
                    This will permanently remove <strong>all</strong> loan-related
                    events from your Google Calendar. This includes summary events,
                    disbursement events, due date events, and interest events.
                  </div>
                )}

                {loading && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-3 mt-3">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium mb-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {dialogMode === 'sync'
                          ? 'Syncing in progress...'
                          : 'Clearing events...'}
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      This may take a few moments... Please do not close this
                      window or refresh the page.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={dialogMode === 'sync' ? handleSync : handleClear}
              disabled={loading}
              className={
                dialogMode === 'clear'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {dialogMode === 'sync' ? 'Syncing...' : 'Clearing...'}
                </>
              ) : dialogMode === 'sync' ? (
                'Sync Now'
              ) : (
                'Clear All Events'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
