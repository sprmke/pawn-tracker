import type {
  DebtAdditionalFee,
  DebtInterestInterval,
  DebtInterestPeriodWithPayments,
} from '@/lib/types';

const PERIODS_PER_YEAR: Record<DebtInterestInterval, number> = {
  Daily: 365,
  Weekly: 52,
  Monthly: 12,
  Annually: 1,
};

const INTERVAL_LABELS: Record<DebtInterestInterval, string> = {
  Daily: 'day',
  Weekly: 'week',
  Monthly: 'month',
  Annually: 'year',
};

function safeParseFloat(value: string | number): number {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/** Keep enough precision for amortized payment matching (up to 6 decimal places). */
export function normalizeInterestRate(value: string | number): string {
  const parsed = safeParseFloat(value);
  if (parsed < 0) return '0';
  return parsed.toFixed(6).replace(/\.?0+$/, '');
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function periodRateFromPercent(interestRate: string | number): number {
  return safeParseFloat(interestRate) / 100;
}

/** Fixed installment for declining-balance (amortized) repayment. */
export function calculateAmortizedPayment(
  principal: string | number,
  interestRate: string | number,
  periodCount: number,
): number {
  const principalAmount = safeParseFloat(principal);
  if (principalAmount <= 0 || periodCount <= 0) return 0;

  const rate = periodRateFromPercent(interestRate);
  if (rate === 0) return principalAmount / periodCount;

  const growth = Math.pow(1 + rate, periodCount);
  return principalAmount * ((rate * growth) / (growth - 1));
}

export function calculatePerPeriodInterest(
  principal: string | number,
  interestRate: string | number,
): number {
  const capital = safeParseFloat(principal);
  const rate = periodRateFromPercent(interestRate);
  return roundMoney(capital * rate);
}

export function calculateAdditionalFeesTotal(
  fees: DebtAdditionalFee[] | null | undefined,
): number {
  if (!fees?.length) return 0;
  return fees.reduce((sum, fee) => sum + safeParseFloat(fee.amount), 0);
}

/** Keep fees with a positive amount; default empty labels to "Fee". */
export function normalizeDebtFees(
  fees: Array<{ label?: string; amount: string }> | null | undefined,
): DebtAdditionalFee[] {
  if (!fees?.length) return [];
  return fees
    .filter((fee) => safeParseFloat(fee.amount) > 0)
    .map((fee) => ({
      label: fee.label?.trim() || 'Fee',
      amount: safeParseFloat(fee.amount).toFixed(2),
    }));
}

export function calculateAnnualInterest(
  principal: string | number,
  interestRate: string | number,
  interval: DebtInterestInterval,
  debtDate: string | Date = new Date(),
): number {
  const periodsInYear = PERIODS_PER_YEAR[interval];
  const schedule = generateInterestSchedule(
    debtDate,
    principal,
    interestRate,
    interval,
    periodsInYear,
  );
  return schedule.reduce((sum, entry) => sum + entry.interest, 0);
}

export function getIntervalLabel(interval: DebtInterestInterval): string {
  return INTERVAL_LABELS[interval];
}

export function getPeriodsPerYear(interval: DebtInterestInterval): number {
  return PERIODS_PER_YEAR[interval];
}

export interface InterestScheduleEntry {
  period: number;
  date: Date;
  interest: number;
  cumulativeInterest: number;
  /** Principal portion repaid this period (amortized over the term). */
  principalPortion: number;
  /** One-time fees applied this period (not included in the payment schedule). */
  feesPortion: number;
  /** Total due this period (principal + interest + fees). */
  periodDue: number;
  /** Running total paid through this period. */
  cumulativePaid: number;
}

export function generateInterestSchedule(
  startDate: string | Date,
  principal: string | number,
  interestRate: string | number,
  interval: DebtInterestInterval,
  periodCount = 12,
): InterestScheduleEntry[] {
  const start = new Date(startDate);
  const principalAmount = safeParseFloat(principal);
  const rate = periodRateFromPercent(interestRate);
  const installment = calculateAmortizedPayment(
    principalAmount,
    interestRate,
    periodCount,
  );
  const schedule: InterestScheduleEntry[] = [];
  let cumulativeInterest = 0;
  let cumulativePaid = 0;
  let remainingBalance = principalAmount;

  for (let i = 0; i < periodCount; i++) {
    const date = new Date(start);
    switch (interval) {
      case 'Daily':
        date.setDate(date.getDate() + i);
        break;
      case 'Weekly':
        date.setDate(date.getDate() + i * 7);
        break;
      case 'Monthly':
        date.setMonth(date.getMonth() + i);
        break;
      case 'Annually':
        date.setFullYear(date.getFullYear() + i);
        break;
    }

    const isLastPeriod = i === periodCount - 1;
    const interest = roundMoney(remainingBalance * rate);
    const principalPortion = isLastPeriod
      ? roundMoney(remainingBalance)
      : roundMoney(installment - interest);
    const periodDue = roundMoney(interest + principalPortion);
    remainingBalance = roundMoney(remainingBalance - principalPortion);

    cumulativeInterest = roundMoney(cumulativeInterest + interest);
    cumulativePaid = roundMoney(cumulativePaid + periodDue);
    schedule.push({
      period: i + 1,
      date,
      interest,
      cumulativeInterest,
      principalPortion,
      feesPortion: 0,
      periodDue,
      cumulativePaid,
    });
  }

  return schedule;
}

export interface DebtSummary {
  principal: number;
  interestRate: number;
  interestInterval: DebtInterestInterval;
  perPeriodInterest: number;
  perPeriodPrincipal: number;
  /** Typical period payment (principal + interest, excluding one-time fees). */
  perPeriodDue: number;
  annualInterest: number;
  additionalFeesTotal: number;
  scheduleInterestTotal: number;
  totalInterestIncludingFees: number;
  totalFeesAndFirstPeriodInterest: number;
  /** Principal plus interest due through the payment schedule. */
  scheduledRepayment: number;
  /** Principal + total interest and fees over the full term. */
  totalRepayment: number;
  schedule: InterestScheduleEntry[];
}

export function calculateDebtSummary(input: {
  principal: string | number;
  interestRate: string | number;
  interestInterval: DebtInterestInterval;
  debtDate: string | Date;
  additionalFees?: DebtAdditionalFee[];
  durationMonths?: number;
  schedulePeriods?: number;
}): DebtSummary {
  const principal = safeParseFloat(input.principal);
  const interestRate = safeParseFloat(input.interestRate);
  const additionalFeesTotal = calculateAdditionalFeesTotal(
    normalizeDebtFees(input.additionalFees),
  );
  const schedulePeriods =
    input.schedulePeriods ??
    durationMonthsToSchedulePeriods(
      input.durationMonths ?? 12,
      input.interestInterval,
    );
  const schedule = generateInterestSchedule(
    input.debtDate,
    principal,
    interestRate,
    input.interestInterval,
    schedulePeriods,
  );
  const scheduleInterestTotal =
    schedule[schedule.length - 1]?.cumulativeInterest ?? 0;
  const perPeriodInterest = schedule[0]?.interest ?? 0;
  const perPeriodPrincipal = schedule[0]?.principalPortion ?? 0;
  const perPeriodDue = schedule[0]?.periodDue ?? 0;
  const annualInterest = calculateAnnualInterest(
    principal,
    interestRate,
    input.interestInterval,
    input.debtDate,
  );
  const scheduledRepayment = principal + scheduleInterestTotal;
  const totalRepayment = scheduledRepayment + additionalFeesTotal;

  return {
    principal,
    interestRate,
    interestInterval: input.interestInterval,
    perPeriodInterest,
    perPeriodPrincipal,
    perPeriodDue,
    annualInterest,
    additionalFeesTotal,
    scheduleInterestTotal,
    totalInterestIncludingFees:
      scheduleInterestTotal + additionalFeesTotal,
    totalFeesAndFirstPeriodInterest: perPeriodInterest + additionalFeesTotal,
    scheduledRepayment,
    totalRepayment,
    schedule,
  };
}

type DebtLike = {
  amount: string;
  interestRate: string;
  interestInterval: DebtInterestInterval;
  date: Date | string;
  durationMonths?: number;
  additionalFees?: DebtAdditionalFee[] | null;
};

function normalizeDebtDate(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDebtDateString(date: Date | string): string {
  return date instanceof Date
    ? date.toISOString().split('T')[0]
    : String(date).split('T')[0];
}

const DEFAULT_DEBT_DURATION_MONTHS = 12;
const PAYMENT_TOLERANCE = 0.02;

export function durationMonthsToSchedulePeriods(
  durationMonths: number,
  interval: DebtInterestInterval,
): number {
  const months = Math.max(1, durationMonths);
  switch (interval) {
    case 'Daily':
      return Math.max(1, Math.round(months * (365 / 12)));
    case 'Weekly':
      return Math.max(1, Math.round(months * (52 / 12)));
    case 'Monthly':
      return months;
    case 'Annually':
      return Math.max(1, Math.ceil(months / 12));
  }
}

export function getDebtEndDate(
  startDate: Date | string,
  durationMonths: number = DEFAULT_DEBT_DURATION_MONTHS,
): Date {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + Math.max(1, durationMonths));
  end.setHours(0, 0, 0, 0);
  return end;
}

/** Debt term has ended (start + duration is on or before today). */
export function isCompletedDebt(
  debt: { date: Date | string; durationMonths?: number },
  asOf: Date = new Date(),
): boolean {
  const today = normalizeDebtDate(asOf);
  const end = getDebtEndDate(
    debt.date,
    debt.durationMonths ?? DEFAULT_DEBT_DURATION_MONTHS,
  );
  return today >= end;
}

/** @deprecated Use {@link isCompletedDebt}. Kept for filter naming compatibility. */
export function isPastDebt(
  debt: { date: Date | string; durationMonths?: number },
  asOf: Date = new Date(),
): boolean {
  return isCompletedDebt(debt, asOf);
}

function debtSummaryInput(debt: DebtLike) {
  return {
    principal: debt.amount,
    interestRate: debt.interestRate,
    interestInterval: debt.interestInterval,
    debtDate: toDebtDateString(debt.date),
    additionalFees: normalizeDebtFees(debt.additionalFees ?? []),
    durationMonths: debt.durationMonths ?? DEFAULT_DEBT_DURATION_MONTHS,
  };
}

export function calculateDebtPrincipal(debt: DebtLike): number {
  return safeParseFloat(debt.amount);
}

export function calculateDebtExpectedInterest(debt: DebtLike): number {
  return calculateDebtSummary(debtSummaryInput(debt)).totalInterestIncludingFees;
}

/** Sum of all period payments recorded against a debt (principal + interest + fees). */
export function calculateDebtPaymentsTotal(
  periods: DebtInterestPeriodWithPayments[] | undefined,
): number {
  if (!periods?.length) return 0;
  return periods.reduce((total, period) => {
    const periodPaid = (period.receivedPayments ?? []).reduce(
      (sum, payment) => sum + safeParseFloat(payment.amount),
      0,
    );
    return total + periodPaid;
  }, 0);
}

/** @deprecated Use {@link calculateDebtPaymentsTotal}. */
export function calculateDebtInterestPaid(
  periods: DebtInterestPeriodWithPayments[] | undefined,
): number {
  return calculateDebtPaymentsTotal(periods);
}

/** Interest and fees portion of payments made so far (borrowing cost, not income). */
export function calculateDebtInterestCostPaid(
  debt: DebtLike & { interestPeriods?: DebtInterestPeriodWithPayments[] },
): number {
  const summary = calculateDebtSummary(debtSummaryInput(debt));
  const scheduleByPeriod = new Map(
    summary.schedule.map((entry) => [entry.period, entry]),
  );
  let cost = 0;

  for (const period of debt.interestPeriods ?? []) {
    const entry = scheduleByPeriod.get(period.periodNumber);
    if (!entry || entry.periodDue <= 0) continue;

    const paid = (period.receivedPayments ?? []).reduce(
      (sum, payment) => sum + safeParseFloat(payment.amount),
      0,
    );
    if (paid <= 0) continue;

    const interestPortion = entry.interest;
    const paidShare = Math.min(1, paid / entry.periodDue);
    cost += interestPortion * paidShare;
  }

  return cost;
}

/** Remaining scheduled amount still owed (principal + interest minus payments made). */
export function calculateDebtInterestOutstanding(
  scheduledRepayment: number,
  periods: DebtInterestPeriodWithPayments[] | undefined,
): number {
  const paid = calculateDebtPaymentsTotal(periods);
  return Math.max(0, scheduledRepayment - paid);
}

/** Interest accrued through today based on the debt schedule (0 if not yet started). */
export function calculateDebtAccruedInterest(
  debt: DebtLike,
  asOf: Date = new Date(),
): number {
  const today = normalizeDebtDate(asOf);
  const start = normalizeDebtDate(debt.date);
  if (today < start) return 0;

  const summary = calculateDebtSummary(debtSummaryInput(debt));

  let accruedInterest = 0;
  let hasPeriod = false;
  for (const entry of summary.schedule) {
    if (normalizeDebtDate(entry.date) > today) break;
    accruedInterest = entry.cumulativeInterest;
    hasPeriod = true;
  }

  if (!hasPeriod) return 0;
  return accruedInterest;
}

/** Debt is fully paid when recorded payments cover the total repayment amount. */
export function isFullyPaidDebt(
  debt: DebtLike & { interestPeriods?: DebtInterestPeriodWithPayments[] },
): boolean {
  const summary = calculateDebtSummary(debtSummaryInput(debt));
  const outstanding = calculateDebtInterestOutstanding(
    summary.scheduledRepayment,
    debt.interestPeriods,
  );
  return outstanding <= PAYMENT_TOLERANCE;
}

export interface InvestorDebtStats {
  totalPrincipal: number;
  activePrincipal: number;
  completedPrincipal: number;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  /** Total interest + fees you would pay over the full term. */
  totalExpectedInterest: number;
  /** Principal + interest + fees owed over the full borrowing term. */
  totalRepayment: number;
  /** Interest and fees already paid (borrowing cost). */
  interestPaid: number;
  /** Total amount repaid across fully paid borrowings. */
  totalRepaid: number;
}

export function calculateInvestorDebtStats(
  debts: Array<DebtLike & { interestPeriods?: DebtInterestPeriodWithPayments[] }>,
): InvestorDebtStats {
  const activeDebts = debts.filter((d) => !isFullyPaidDebt(d));
  const completedDebts = debts.filter((d) => isFullyPaidDebt(d));

  const totalPrincipal = debts.reduce(
    (sum, debt) => sum + calculateDebtPrincipal(debt),
    0,
  );
  const activePrincipal = activeDebts.reduce(
    (sum, debt) => sum + calculateDebtPrincipal(debt),
    0,
  );
  const completedPrincipal = completedDebts.reduce(
    (sum, debt) => sum + calculateDebtPrincipal(debt),
    0,
  );
  const totalExpectedInterest = debts.reduce(
    (sum, debt) => sum + calculateDebtExpectedInterest(debt),
    0,
  );
  const totalRepayment = debts.reduce(
    (sum, debt) => sum + calculateDebtSummary(debtSummaryInput(debt)).totalRepayment,
    0,
  );
  const interestPaid = debts.reduce(
    (sum, debt) => sum + calculateDebtInterestCostPaid(debt),
    0,
  );
  const totalRepaid = completedDebts.reduce(
    (sum, debt) => sum + calculateDebtPaymentsTotal(debt.interestPeriods),
    0,
  );

  return {
    totalPrincipal,
    activePrincipal,
    completedPrincipal,
    totalCount: debts.length,
    activeCount: activeDebts.length,
    completedCount: completedDebts.length,
    totalExpectedInterest,
    totalRepayment,
    interestPaid,
    totalRepaid,
  };
}
