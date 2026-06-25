import type { DebtInterestInterval } from '@/lib/types';
import { normalizeDebtFees } from '@/lib/debt-calculations';

const VALID_INTERVALS: DebtInterestInterval[] = [
  'Daily',
  'Weekly',
  'Monthly',
  'Annually',
];

export function parseDebtBody(body: Record<string, unknown>) {
  const investorId = Number(body.investorId);
  const name = String(body.name ?? '').trim();
  const amount = String(body.amount ?? '');
  const interestRate = String(body.interestRate ?? '');
  const parsedDuration = parseInt(String(body.durationMonths ?? 12), 10);
  const durationMonths =
    Number.isFinite(parsedDuration) && parsedDuration >= 1 ? parsedDuration : 12;

  const interval = body.interestInterval as DebtInterestInterval;
  if (!VALID_INTERVALS.includes(interval)) {
    throw new Error('Invalid interest accrual period');
  }

  if (!investorId || !name || !amount || !body.date || !interestRate) {
    throw new Error('Missing required borrowing fields');
  }

  return {
    investorId,
    name,
    amount,
    date: new Date(String(body.date)),
    interestRate,
    interestInterval: interval,
    durationMonths,
    additionalFees: normalizeDebtFees(
      body.additionalFees as Array<{ label?: string; amount: string }> | null,
    ),
    notes: body.notes ? String(body.notes).trim() : null,
  };
}
