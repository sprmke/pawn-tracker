import { revalidateTag } from 'next/cache';

export const CACHE_TAGS = {
  loans: 'loans',
  investors: 'investors',
  borrowers: 'borrowers',
  witnesses: 'witnesses',
  debts: 'debts',
  transactions: 'transactions',
  dashboard: 'dashboard',
} as const;

type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

function invalidate(tags: CacheTag[]) {
  for (const tag of new Set(tags)) {
    revalidateTag(tag);
  }
}

export function invalidateLoanData() {
  invalidate([
    CACHE_TAGS.loans,
    CACHE_TAGS.investors,
    CACHE_TAGS.borrowers,
    CACHE_TAGS.transactions,
    CACHE_TAGS.dashboard,
  ]);
}

export function invalidateInvestorData() {
  invalidate([
    CACHE_TAGS.investors,
    CACHE_TAGS.loans,
    CACHE_TAGS.debts,
    CACHE_TAGS.transactions,
    CACHE_TAGS.dashboard,
  ]);
}

export function invalidateBorrowerData() {
  invalidate([CACHE_TAGS.borrowers, CACHE_TAGS.loans, CACHE_TAGS.dashboard]);
}

export function invalidateWitnessData() {
  invalidate([CACHE_TAGS.witnesses, CACHE_TAGS.loans]);
}

export function invalidateDebtData() {
  invalidate([CACHE_TAGS.debts, CACHE_TAGS.investors, CACHE_TAGS.dashboard]);
}

export function invalidateTransactionData() {
  invalidate([
    CACHE_TAGS.transactions,
    CACHE_TAGS.investors,
    CACHE_TAGS.loans,
    CACHE_TAGS.dashboard,
  ]);
}
