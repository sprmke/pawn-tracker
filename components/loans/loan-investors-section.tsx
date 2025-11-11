import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { InvestorTransactionsDisplay } from './investor-transactions-display';

interface InvestorTransaction {
  id?: number | string;
  amount: string;
  interestRate: string;
  interestType?: string;
  sentDate: Date | string;
  isPaid: boolean;
}

interface InterestPeriod {
  id?: number | string;
  dueDate: Date | string;
  interestRate: string;
  interestAmount?: string;
  interestType?: string;
}

interface InvestorWithTransactions {
  investor: {
    id: number;
    name: string;
    email?: string;
  };
  transactions: InvestorTransaction[];
  hasMultipleInterest?: boolean;
  interestPeriods?: InterestPeriod[];
}

interface LoanInvestorsSectionProps {
  investorsWithTransactions: InvestorWithTransactions[];
  title?: string;
  showEmail?: boolean;
  loanId?: number;
  onRefresh?: () => void;
}

export function LoanInvestorsSection({
  investorsWithTransactions,
  title,
  showEmail = true,
  loanId,
  onRefresh,
}: LoanInvestorsSectionProps) {
  const hasInvestors =
    investorsWithTransactions && investorsWithTransactions.length > 0;

  return (
    <Card id="investors-section" className={title ? '' : 'p-0 border-0'}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'p-0'}>
        {!hasInvestors ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No investors allocated</p>
          </div>
        ) : (
          <InvestorTransactionsDisplay
            investorsWithTransactions={investorsWithTransactions}
            showEmail={showEmail}
            loanId={loanId}
            onRefresh={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}
