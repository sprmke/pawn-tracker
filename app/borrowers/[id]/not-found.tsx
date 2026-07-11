import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function BorrowerNotFound() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-xl font-semibold">Borrower Not Found</h1>
          <p className="mb-6 text-center text-muted-foreground">
            The borrower you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Link href="/loans">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Loans
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
