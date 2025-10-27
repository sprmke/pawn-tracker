import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoanNotFound() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loan Not Found</h1>
          <p className="text-muted-foreground text-center mb-6">
            The loan you're looking for doesn't exist or has been deleted.
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
