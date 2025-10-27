import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/transactions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              Transaction Not Found
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The transaction you&apos;re looking for doesn&apos;t exist or may
            have been deleted.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/transactions">View All Transactions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/transactions/new">Create New Transaction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
