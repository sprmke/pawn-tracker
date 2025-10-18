import {
  LoanStatus,
  LoanType,
  TransactionType,
  TransactionDirection,
} from './types';

/**
 * Badge configuration for consistent styling across the application
 */

// Loan Status Badge Configuration
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
    className: 'bg-green-600 hover:bg-green-700',
    dotColor: 'bg-green-500',
  },
  'Partially Funded': {
    variant: 'secondary',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    dotColor: 'bg-yellow-500',
  },
  Completed: {
    variant: 'default',
    className: 'bg-blue-600 hover:bg-blue-700',
    dotColor: 'bg-blue-500',
  },
  Overdue: {
    variant: 'destructive',
    className: 'bg-red-600 hover:bg-red-700',
    dotColor: 'bg-red-500',
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
    className: 'border-orange-500 text-orange-700 dark:text-orange-400',
  },
  'OR/CR': {
    variant: 'outline',
    className: 'border-purple-500 text-purple-700 dark:text-purple-400',
  },
  Agent: {
    variant: 'outline',
    className: 'border-pink-500 text-pink-700 dark:text-pink-400',
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
  Pawn: {
    variant: 'outline',
    className: 'border-purple-500 text-purple-700 dark:text-purple-400',
  },
  Salary: {
    variant: 'outline',
    className: 'border-green-500 text-green-700 dark:text-green-400',
  },
  'Credit Card': {
    variant: 'outline',
    className: 'border-blue-500 text-blue-700 dark:text-blue-400',
  },
  Debt: {
    variant: 'outline',
    className: 'border-red-500 text-red-700 dark:text-red-400',
  },
  Others: {
    variant: 'outline',
    className: 'border-gray-500 text-gray-700 dark:text-gray-400',
  },
};

// Transaction Direction Badge Configuration
export const transactionDirectionConfig: Record<
  TransactionDirection,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }
> = {
  In: {
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-700',
  },
  Out: {
    variant: 'secondary',
    className: 'bg-gray-600 hover:bg-gray-700',
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
