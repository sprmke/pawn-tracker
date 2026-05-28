import {
  LoanStatus,
  LoanType,
  TransactionType,
  TransactionDirection,
  InterestPeriodStatus,
} from './types';

export const loanStatusConfig: Record<
  LoanStatus,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    dotColor?: string;
  }
> = {
  'Fully Funded': {
    variant: 'default',
    className: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  'Partially Funded': {
    variant: 'secondary',
    className: 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  Completed: {
    variant: 'default',
    className: 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
  },
  Overdue: {
    variant: 'destructive',
    className: 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
};

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
      'border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700',
  },
  'OR/CR': {
    variant: 'outline',
    className:
      'border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700',
  },
  Agent: {
    variant: 'outline',
    className:
      'border-pink-200 text-pink-700 bg-pink-50 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-700',
  },
};

export const transactionTypeConfig: Record<
  TransactionType,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }
> = {
  Investment: {
    variant: 'outline',
    className:
      'border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700',
  },
};

export const transactionDirectionConfig: Record<
  TransactionDirection,
  {
    variant: 'success' | 'destructive';
    className?: string;
  }
> = {
  In: {
    variant: 'success',
    className: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200',
  },
  Out: {
    variant: 'destructive',
    className: 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200',
  },
};

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
    className: 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  Incomplete: {
    variant: 'outline',
    className:
      'border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-700',
    dotColor: 'bg-orange-500',
  },
  Completed: {
    variant: 'default',
    className: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  Overdue: {
    variant: 'destructive',
    className: 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
};

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
