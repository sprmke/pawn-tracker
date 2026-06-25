import { db } from '@/db';
import {
  debtInterestPeriods,
  debtReceivedPayments,
  debts,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateDebtSummary, normalizeDebtFees } from '@/lib/debt-calculations';

export const DEBT_AMOUNT_TOLERANCE = 0.02;

function derivePeriodStatus(
  paidTotal: number,
  expectedAmount: number,
  dueDate: Date,
): 'Pending' | 'Overdue' | 'Incomplete' | 'Completed' {
  if (paidTotal <= DEBT_AMOUNT_TOLERANCE) {
    const now = new Date();
    return now > dueDate ? 'Overdue' : 'Pending';
  }
  if (paidTotal + DEBT_AMOUNT_TOLERANCE >= expectedAmount) {
    return 'Completed';
  }
  return 'Incomplete';
}

export async function recalculateDebtInterestPeriodStatus(
  periodId: number,
): Promise<void> {
  const period = await db.query.debtInterestPeriods.findFirst({
    where: eq(debtInterestPeriods.id, periodId),
    with: { receivedPayments: true },
  });
  if (!period) return;

  const paidTotal = (period.receivedPayments ?? []).reduce(
    (sum, payment) => sum + (parseFloat(payment.amount) || 0),
    0,
  );
  const expectedAmount = parseFloat(period.expectedInterest) || 0;
  const status = derivePeriodStatus(
    paidTotal,
    expectedAmount,
    new Date(period.dueDate),
  );

  await db
    .update(debtInterestPeriods)
    .set({ status, updatedAt: new Date() })
    .where(eq(debtInterestPeriods.id, periodId));
}

export async function syncDebtInterestPeriods(debtId: number): Promise<void> {
  const debt = await db.query.debts.findFirst({
    where: eq(debts.id, debtId),
  });
  if (!debt) return;

  const debtDate =
    debt.date instanceof Date
      ? debt.date.toISOString().split('T')[0]
      : String(debt.date).split('T')[0];

  const summary = calculateDebtSummary({
    principal: debt.amount,
    interestRate: debt.interestRate,
    interestInterval: debt.interestInterval,
    debtDate,
    additionalFees: normalizeDebtFees(debt.additionalFees ?? []),
    durationMonths: debt.durationMonths,
  });

  const existing = await db.query.debtInterestPeriods.findMany({
    where: eq(debtInterestPeriods.debtId, debtId),
    with: { receivedPayments: true },
  });
  const existingByNumber = new Map(
    existing.map((period) => [period.periodNumber, period]),
  );

  for (const entry of summary.schedule) {
    const expectedAmount = entry.periodDue.toFixed(2);
    const dueDate = entry.date;
    const current = existingByNumber.get(entry.period);

    if (current) {
      const hasPayments = (current.receivedPayments ?? []).length > 0;
      if (!hasPayments) {
        const status = derivePeriodStatus(0, entry.periodDue, dueDate);
        await db
          .update(debtInterestPeriods)
          .set({
            dueDate,
            expectedInterest: expectedAmount,
            status,
            updatedAt: new Date(),
          })
          .where(eq(debtInterestPeriods.id, current.id));
      } else {
        await db
          .update(debtInterestPeriods)
          .set({
            dueDate,
            expectedInterest: expectedAmount,
            updatedAt: new Date(),
          })
          .where(eq(debtInterestPeriods.id, current.id));
        await recalculateDebtInterestPeriodStatus(current.id);
      }
      existingByNumber.delete(entry.period);
      continue;
    }

    const status = derivePeriodStatus(0, entry.periodDue, dueDate);
    await db.insert(debtInterestPeriods).values({
      debtId,
      periodNumber: entry.period,
      dueDate,
      expectedInterest: expectedAmount,
      status,
    });
  }

  for (const [, period] of existingByNumber) {
    if ((period.receivedPayments ?? []).length === 0) {
      await db
        .delete(debtInterestPeriods)
        .where(eq(debtInterestPeriods.id, period.id));
    }
  }
}

export async function markOverdueDebtInterestPeriods(
  debtId: number,
): Promise<void> {
  const periods = await db.query.debtInterestPeriods.findMany({
    where: eq(debtInterestPeriods.debtId, debtId),
    with: { receivedPayments: true },
  });

  const now = new Date();
  for (const period of periods) {
    const paidTotal = (period.receivedPayments ?? []).reduce(
      (sum, payment) => sum + (parseFloat(payment.amount) || 0),
      0,
    );
    const expectedAmount = parseFloat(period.expectedInterest) || 0;
    const status = derivePeriodStatus(
      paidTotal,
      expectedAmount,
      new Date(period.dueDate),
    );
    if (status !== period.status) {
      await db
        .update(debtInterestPeriods)
        .set({ status, updatedAt: now })
        .where(eq(debtInterestPeriods.id, period.id));
    }
  }
}

export async function deleteDebtReceivedPaymentsForPeriod(
  periodId: number,
): Promise<void> {
  await db
    .delete(debtReceivedPayments)
    .where(eq(debtReceivedPayments.debtInterestPeriodId, periodId));
}
