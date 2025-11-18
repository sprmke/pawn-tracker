import {
  LoanStatus,
  LoanType,
  TransactionType,
  TransactionDirection,
  InterestPeriodStatus,
} from './types';

/**
 * Badge configuration for consistent styling across the application
 */

// Loan Status Badge Configuration (Pastel Colors)
export const loanStatusConfig: Record<
  LoanStatus,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    dotColor?: string; // For status indicators
  }
> = {
  'Fully Funded': {
    variant: 'default',
    className: 'bg-emerald-400 hover:bg-emerald-500 text-emerald-950',
    dotColor: 'bg-emerald-400',
  },
  'Partially Funded': {
    variant: 'secondary',
    className: 'bg-amber-300 hover:bg-amber-400 text-amber-950',
    dotColor: 'bg-amber-300',
  },
  Completed: {
    variant: 'default',
    className: 'bg-sky-400 hover:bg-sky-500 text-sky-950',
    dotColor: 'bg-sky-400',
  },
  Overdue: {
    variant: 'destructive',
    className: 'bg-rose-400 hover:bg-rose-500 text-rose-950',
    dotColor: 'bg-rose-400',
  },
};

// Loan Type Badge Configuration
export const loanTypeConfig: Record<
  LoanType,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }
> = {
  'Lot Title': {
    variant: 'outline',
    className:
      'border-orange-400 text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-600',
  },
  'OR/CR': {
    variant: 'outline',
    className:
      'border-indigo-400 text-indigo-700 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-600',
  },
  Agent: {
    variant: 'outline',
    className:
      'border-fuchsia-400 text-fuchsia-700 bg-fuchsia-100 dark:bg-fuchsia-900 dark:text-fuchsia-300 dark:border-fuchsia-600',
  },
};

// Transaction Type Badge Configuration
export const transactionTypeConfig: Record<
  TransactionType,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }
> = {
  Loan: {
    variant: 'outline',
    className:
      'border-fuchsia-400 text-fuchsia-700 bg-fuchsia-100 dark:bg-fuchsia-900 dark:text-fuchsia-300 dark:border-fuchsia-600',
  },
  Investment: {
    variant: 'outline',
    className:
      'border-violet-400 text-violet-700 bg-violet-100 dark:bg-violet-900 dark:text-violet-300 dark:border-violet-600',
  },
};

// Transaction Direction Badge Configuration (Pastel Colors)
export const transactionDirectionConfig: Record<
  TransactionDirection,
  {
    variant: 'success' | 'destructive';
    className?: string;
  }
> = {
  In: {
    variant: 'success',
    className: 'bg-emerald-400 hover:bg-emerald-500 text-emerald-950',
  },
  Out: {
    variant: 'destructive',
    className: 'bg-rose-400 hover:bg-rose-500 text-rose-950',
  },
};

// Interest Period Status Badge Configuration (Pastel Colors)
export const interestPeriodStatusConfig: Record<
  InterestPeriodStatus,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    dotColor?: string;
  }
> = {
  Pending: {
    variant: 'secondary',
    className: 'bg-amber-300 hover:bg-amber-400 text-amber-950',
    dotColor: 'bg-amber-300',
  },
  Completed: {
    variant: 'default',
    className: 'bg-emerald-400 hover:bg-emerald-500 text-emerald-950',
    dotColor: 'bg-emerald-400',
  },
  Overdue: {
    variant: 'destructive',
    className: 'bg-rose-400 hover:bg-rose-500 text-rose-950',
    dotColor: 'bg-rose-400',
  },
};

// Helper functions to get badge properties
export function getLoanStatusBadge(status: LoanStatus) {
  return loanStatusConfig[status];
}

export function getLoanTypeBadge(type: LoanType) {
  return loanTypeConfig[type];
}

export function getTransactionTypeBadge(type: TransactionType) {
  return transactionTypeConfig[type];
}

export function getTransactionDirectionBadge(direction: TransactionDirection) {
  return transactionDirectionConfig[direction];
}

export function getInterestPeriodStatusBadge(status: InterestPeriodStatus) {
  return interestPeriodStatusConfig[status];
}
