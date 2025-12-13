'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common';
import { Calendar, RefreshCw, Loader2 } from 'lucide-react';

export default function CalendarSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setResults(null);

      const response = await fetch('/api/loans/sync-calendar', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        toast.success(data.message || 'Calendar sync completed');
      } else {
        toast.error(data.error || 'Failed to sync calendar events');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar events');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Google Calendar Sync"
        description="Sync loan events with Google Calendar"
        icon={Calendar}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sync All Loans</CardTitle>
          <CardDescription>
            This will sync all your loans with Google Calendar. Existing calendar events will be
            updated, and new events will be created for loans that don't have calendar events yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSyncAll}
              disabled={syncing}
              size="lg"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All Loans
                </>
              )}
            </Button>
          </div>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.totalLoans}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-600">
                      Synced Successfully
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {results.successCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-600">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{results.errorCount}</div>
                  </CardContent>
                </Card>
              </div>

              {results.results && results.results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Sync Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.results.map((result: any) => (
                        <div
                          key={result.loanId}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            result.success
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{result.loanName}</div>
                            <div className="text-sm text-muted-foreground">
                              Loan ID: {result.loanId}
                            </div>
                          </div>
                          <div className="text-right">
                            {result.success ? (
                              <div className="text-sm text-green-600">
                                ✓ {result.eventCount} events created
                              </div>
                            ) : (
                              <div className="text-sm text-red-600">✗ {result.error}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Before syncing, make sure you have configured the Google Calendar integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-2">
            <p>To set up Google Calendar integration:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Create a Google Cloud service account</li>
              <li>Enable the Google Calendar API</li>
              <li>Share your calendar with the service account</li>
              <li>Add the credentials to your .env.local file</li>
            </ol>
            <p className="mt-4">
              For detailed setup instructions, see{' '}
              <a
                href="https://github.com/yourusername/pawn-tracker/blob/main/GOOGLE_CALENDAR_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GOOGLE_CALENDAR_SETUP.md
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

