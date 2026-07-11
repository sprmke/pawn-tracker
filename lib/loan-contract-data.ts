import {
  calculateTotalAmount,
  calculateTotalInterest,
  calculateTotalPrincipal,
  calculateLoanDuration,
  groupByInvestor,
} from "@/lib/calculations";
import type {
  InterestPeriod,
  Investor,
  LoanInvestor,
  LoanType,
  LoanWithInvestors,
} from "@/lib/types";
import {
  getCollateralSummary,
  getContractTitle,
} from "@/lib/loan-contract-content";

export interface ContractLender {
  name: string;
  contactNumber: string | null;
  email: string;
  address: string | null;
  validIdUrl: string | null;
  eSignatureUrl: string | null;
  principalAmount: number;
  interestDescription: string;
}

export interface LoanContractDraftInvestor {
  investor: Investor;
  transactions: Array<{
    amount: string;
    interestRate: string;
    interestAmount: string;
    interestType: "rate" | "fixed";
    sentDate: string;
  }>;
  hasMultipleInterest: boolean;
  interestPeriods: Array<{
    dueDate: string;
    interestRate: string;
    interestAmount: string;
    interestType: "rate" | "fixed";
  }>;
}

export interface LoanContractDraftInput {
  borrowerName: string;
  borrowerAddress?: string | null;
  borrowerContact?: string | null;
  borrowerEmail?: string | null;
  borrowerValidIdUrl?: string | null;
  borrowerESignatureUrl?: string | null;
  loanTitleLabel: string;
  type: LoanType;
  dueDate: string;
  freeLotSqm?: string;
  notes?: string;
  loanId?: number;
  investors: LoanContractDraftInvestor[];
  totalPrincipal: number;
  totalInterest: number;
  totalAmountDue: number;
}

export interface ContractDetailRow {
  label: string;
  value: string;
}

export interface LoanContractData {
  contractNumber: string;
  agreementDate: Date | string;
  borrowerName: string;
  borrowerAddress: string | null;
  borrowerContact: string | null;
  borrowerEmail: string | null;
  borrowerValidIdUrl: string | null;
  borrowerESignatureUrl: string | null;
  loanTitleLabel: string;
  loanType: LoanType;
  contractTitle: string;
  collateralDescription: string;
  freeLotSqm: number | null;
  dateBorrowed: Date | string;
  dueDate: Date | string;
  principalAmount: number;
  totalInterest: number;
  totalAmountDue: number;
  lenders: ContractLender[];
  notes: string | null;
}

function formatContractDate(date: Date | string | null | undefined): string {
  if (!date) return "_______________";
  const d = coerceToDate(date, null);
  if (!d) return "_______________";
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function coerceToDate(
  value: Date | string | null | undefined,
  fallback: Date | null = new Date(),
): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallback;
}

/** Coerce date fields after JSON serialization (RSC props, API responses). */
export function normalizeLoanContractData(
  data: LoanContractData,
): LoanContractData {
  return {
    ...data,
    agreementDate: coerceToDate(data.agreementDate) ?? new Date(),
    dateBorrowed: coerceToDate(data.dateBorrowed) ?? new Date(),
    dueDate: coerceToDate(data.dueDate) ?? new Date(),
  };
}

export function formatContractCurrency(
  amount: number | string | null | undefined,
): string {
  if (amount === null || amount === undefined) return "P0.00";
  const numValue = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(numValue)) return "P0.00";
  const formatted = numValue.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `P${formatted}`;
}

function formatInterestDescription(
  transactions: Array<
    LoanInvestor & {
      interestPeriods?: InterestPeriod[];
    }
  >,
): string {
  const withPeriods = transactions.find(
    (t) => t.hasMultipleInterest && (t.interestPeriods?.length ?? 0) > 0,
  );

  if (withPeriods?.interestPeriods?.length) {
    return withPeriods.interestPeriods
      .map((period) => {
        const rateLabel =
          period.interestType === "fixed"
            ? formatContractCurrency(period.interestRate)
            : `${period.interestRate}%`;
        return `${formatContractDate(period.dueDate)} — ${rateLabel}`;
      })
      .join("; ");
  }

  const primary = transactions[0];
  if (!primary) return "As agreed between the parties";

  if (primary.interestType === "fixed") {
    return `Fixed interest of ${formatContractCurrency(primary.interestRate)}`;
  }

  return `${primary.interestRate}% of principal disbursed`;
}

function formatDraftInterestDescription(
  allocation: LoanContractDraftInvestor,
): string {
  if (allocation.hasMultipleInterest && allocation.interestPeriods.length > 0) {
    return allocation.interestPeriods
      .map((period) => {
        const rateLabel =
          period.interestType === "fixed"
            ? formatContractCurrency(period.interestAmount)
            : `${period.interestRate}%`;
        return `${formatContractDate(period.dueDate)} — ${rateLabel}`;
      })
      .join("; ");
  }

  const primary = allocation.transactions[0];
  if (!primary) return "As agreed between the parties";

  if (primary.interestType === "fixed") {
    return `Fixed interest of ${formatContractCurrency(primary.interestAmount)}`;
  }

  return `${primary.interestRate}% of principal disbursed`;
}

function getEarliestSentDateFromDraft(
  investors: LoanContractDraftInvestor[],
): Date {
  const sentDates = investors
    .flatMap((allocation) =>
      allocation.transactions.map((t) => new Date(t.sentDate)),
    )
    .filter((date) => !Number.isNaN(date.getTime()));

  if (sentDates.length === 0) {
    return new Date();
  }

  return sentDates.reduce((earliest, date) =>
    date < earliest ? date : earliest,
  );
}

function getEarliestSentDate(loan: LoanWithInvestors): Date {
  const sentDates = loan.loanInvestors
    .map((li) => new Date(li.sentDate))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (sentDates.length === 0) {
    return new Date(loan.createdAt);
  }

  return sentDates.reduce((earliest, date) =>
    date < earliest ? date : earliest,
  );
}

export function buildLoanContractDataFromDraft(
  draft: LoanContractDraftInput,
): LoanContractData {
  const dateBorrowed = getEarliestSentDateFromDraft(draft.investors);
  const freeLotSqm = draft.freeLotSqm ? Number(draft.freeLotSqm) : null;
  const parsedFreeLotSqm =
    freeLotSqm !== null && !Number.isNaN(freeLotSqm) ? freeLotSqm : null;
  const dueDate = draft.dueDate ? new Date(draft.dueDate) : new Date();
  const contractId = draft.loanId ?? "NEW";

  const lenders: ContractLender[] = draft.investors
    .map((allocation) => ({
      name: allocation.investor.name,
      contactNumber: allocation.investor.contactNumber,
      email: allocation.investor.email,
      address: allocation.investor.address ?? null,
      validIdUrl: allocation.investor.validIdUrl ?? null,
      eSignatureUrl: allocation.investor.eSignatureUrl ?? null,
      principalAmount: allocation.transactions.reduce(
        (sum, transaction) => sum + (parseFloat(transaction.amount) || 0),
        0,
      ),
      interestDescription: formatDraftInterestDescription(allocation),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    contractNumber: `PT-${contractId}-${dateBorrowed.getFullYear()}`,
    agreementDate: dateBorrowed,
    borrowerName: draft.borrowerName.trim() || "_________________________",
    borrowerAddress: draft.borrowerAddress?.trim() || null,
    borrowerContact: draft.borrowerContact?.trim() || null,
    borrowerEmail: draft.borrowerEmail?.trim() || null,
    borrowerValidIdUrl: draft.borrowerValidIdUrl ?? null,
    borrowerESignatureUrl: draft.borrowerESignatureUrl ?? null,
    loanTitleLabel: draft.loanTitleLabel.trim() || "_________________________",
    loanType: draft.type,
    contractTitle: getContractTitle(draft.type),
    collateralDescription: getCollateralSummary(
      draft.type,
      draft.loanTitleLabel,
      parsedFreeLotSqm,
    ),
    freeLotSqm: parsedFreeLotSqm,
    dateBorrowed,
    dueDate: Number.isNaN(dueDate.getTime()) ? new Date() : dueDate,
    principalAmount: draft.totalPrincipal,
    totalInterest: draft.totalInterest,
    totalAmountDue: draft.totalAmountDue,
    lenders,
    notes: draft.notes?.trim() || null,
  };
}

export function getContractDetailRows(
  data: LoanContractData,
): ContractDetailRow[] {
  const rows: ContractDetailRow[] = [
    { label: "Contract No.", value: data.contractNumber },
    { label: "Agreement Date", value: formatContractDate(data.agreementDate) },
    { label: "Borrower", value: data.borrowerName },
    { label: "Loan Title / Label", value: data.loanTitleLabel },
    { label: "Loan Type", value: data.loanType },
    { label: "Collateral / Security", value: data.collateralDescription },
    {
      label: "Date Borrowed",
      value: formatContractDate(data.dateBorrowed),
    },
    {
      label: "Expected Payment Date",
      value: formatContractDate(data.dueDate),
    },
    {
      label: "Initial Loan Term",
      value: calculateLoanDuration(data.dueDate, data.dateBorrowed),
    },
    {
      label: "Principal Amount",
      value: formatContractCurrency(data.principalAmount),
    },
    {
      label: "Total Interest",
      value: formatContractCurrency(data.totalInterest),
    },
    {
      label: "Total Amount Due",
      value: formatContractCurrency(data.totalAmountDue),
    },
  ];

  if (data.freeLotSqm) {
    rows.splice(6, 0, {
      label: "Free Lot Area",
      value: `${data.freeLotSqm} sqm`,
    });
  }

  return rows;
}

export function buildLoanContractData(
  loan: LoanWithInvestors,
): LoanContractData {
  const investorGroups = groupByInvestor(loan.loanInvestors);
  const lenders: ContractLender[] = [];

  investorGroups.forEach((transactions, investorId) => {
    const investor = transactions[0]?.investor;
    if (!investor) return;

    lenders.push({
      name: investor.name,
      contactNumber: investor.contactNumber,
      email: investor.email,
      address: investor.address ?? null,
      validIdUrl: investor.validIdUrl ?? null,
      eSignatureUrl: investor.eSignatureUrl ?? null,
      principalAmount: transactions.reduce(
        (sum, t) => sum + (parseFloat(t.amount) || 0),
        0,
      ),
      interestDescription: formatInterestDescription(transactions),
    });
  });

  lenders.sort((a, b) => a.name.localeCompare(b.name));

  const dateBorrowed = getEarliestSentDate(loan);

  return {
    contractNumber: `PT-${loan.id}-${dateBorrowed.getFullYear()}`,
    agreementDate: dateBorrowed,
    borrowerName: loan.borrower?.name ?? "_________________________",
    borrowerAddress: loan.borrower?.address ?? null,
    borrowerContact: loan.borrower?.contactNumber ?? null,
    borrowerEmail: loan.borrower?.email ?? null,
    borrowerValidIdUrl: loan.borrower?.validIdUrl ?? null,
    borrowerESignatureUrl: loan.borrower?.eSignatureUrl ?? null,
    loanTitleLabel: loan.loanName,
    loanType: loan.type,
    contractTitle: getContractTitle(loan.type),
    collateralDescription: getCollateralSummary(
      loan.type,
      loan.loanName,
      loan.freeLotSqm,
    ),
    freeLotSqm: loan.freeLotSqm,
    dateBorrowed,
    dueDate: new Date(loan.dueDate),
    principalAmount: calculateTotalPrincipal(loan.loanInvestors),
    totalInterest: calculateTotalInterest(loan.loanInvestors),
    totalAmountDue: calculateTotalAmount(loan.loanInvestors),
    lenders,
    notes: loan.notes,
  };
}

export function getLoanContractFilename(loan: LoanWithInvestors): string {
  const safeName = loan.loanName
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `loan-contract_${safeName || `loan-${loan.id}`}_${dateStamp}.pdf`;
}

export { formatContractDate };
