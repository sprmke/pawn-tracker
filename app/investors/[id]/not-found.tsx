import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function InvestorNotFound() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Investor Not Found</h1>
          <p className="text-muted-foreground text-center mb-6">
            The investor you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/investors">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Investors
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
