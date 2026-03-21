'use client';

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
  Font,
} from '@react-pdf/renderer';
import {
  PDF_COLORS,
  formatDateForPDF,
  formatCurrencyForPDF,
  downloadBlob,
} from '@/lib/pdf-export';
import {
  calculateLoanStats,
  calculateInterest,
} from '@/lib/calculations';
import { LoanWithInvestors, LoanStatus, LoanType, InterestPeriodStatus } from '@/lib/types';

// Register fonts for better typography
Font.registerHyphenationCallback((word) => [word]);

// ─── Style Sheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: PDF_COLORS.white,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 36,
    fontSize: 9,
    color: PDF_COLORS.primary,
  },

  // ── Page Header ──
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: `1.5 solid ${PDF_COLORS.accentBlue}`,
  },
  pageHeaderLeft: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.accentBlue,
    letterSpacing: 1,
  },
  reportTitle: {
    fontSize: 10,
    color: PDF_COLORS.secondary,
    marginTop: 2,
  },
  pageHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  reportDate: {
    fontSize: 9,
    color: PDF_COLORS.secondary,
  },
  reportCount: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 2,
  },

  // ── Loan Card ──
  loanCard: {
    marginBottom: 16,
    borderRadius: 6,
    border: `1 solid ${PDF_COLORS.border}`,
    // No overflow:hidden — let content flow across pages naturally
  },

  // ── Loan Card Header ──
  loanHeader: {
    backgroundColor: PDF_COLORS.sectionBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: `1 solid ${PDF_COLORS.border}`,
  },
  loanHeaderLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  loanName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.primary,
  },
  loanHeaderRight: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 12,
    alignItems: 'center',
    flexShrink: 0,
  },

  // ── Badges ──
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Section Container ──
  section: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottom: `1 solid ${PDF_COLORS.border}`,
  },
  sectionNoBorder: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // ── Financial Summary ──
  financialGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  financialCell: {
    // flexBasis: 0 + minWidth: 0 so every column shares space equally (avoids last cell growing with content in react-pdf/Yoga)
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: PDF_COLORS.background,
    borderRadius: 4,
    padding: 8,
    border: `1 solid ${PDF_COLORS.border}`,
  },
  financialCellLabel: {
    fontSize: 7,
    color: PDF_COLORS.muted,
    marginBottom: 3,
  },
  financialCellValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.primary,
  },
  financialCellValueSmall: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.secondary,
  },

  // ── Investor Breakdown ──
  investorBlock: {
    marginBottom: 10,
    borderRadius: 4,
    border: `1 solid ${PDF_COLORS.border}`,
    // No overflow:hidden — lets investor content flow across pages
  },
  investorBlockLast: {
    marginBottom: 0,
    borderRadius: 4,
    border: `1 solid ${PDF_COLORS.border}`,
  },
  investorHeader: {
    backgroundColor: PDF_COLORS.accentBlueBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1 solid #dbeafe`,
  },
  investorName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.accentBlue,
  },
  investorSentDate: {
    fontSize: 7.5,
    color: PDF_COLORS.secondary,
  },
  investorDetails: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  investorDetailItem: {
    flexDirection: 'column',
    minWidth: 80,
  },
  investorDetailLabel: {
    fontSize: 7,
    color: PDF_COLORS.muted,
    marginBottom: 2,
  },
  investorDetailValue: {
    fontSize: 9,
    color: PDF_COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Interest Periods Table ──
  periodsContainer: {
    marginTop: 6,
  },
  periodsLabel: {
    fontSize: 7,
    color: PDF_COLORS.secondary,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  periodTable: {
    border: `1 solid ${PDF_COLORS.border}`,
    borderRadius: 3,
  },
  periodTableHeader: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.sectionBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottom: `1 solid ${PDF_COLORS.border}`,
  },
  periodTableHeaderCell: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottom: `0.5 solid ${PDF_COLORS.border}`,
  },
  periodTableRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  periodTableCell: {
    fontSize: 8,
    color: PDF_COLORS.primary,
  },
  /** Column wrapper so status badge stays content-width (column default alignItems would stretch badge full width) */
  periodStatusCell: {
    flex: 1.5,
    alignItems: 'flex-start',
  },

  // ── Received Payments ──
  paymentsTable: {
    border: `1 solid ${PDF_COLORS.border}`,
    borderRadius: 3,
    marginTop: 4,
  },
  paymentsTableHeader: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.sectionBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottom: `1 solid ${PDF_COLORS.border}`,
  },
  paymentsTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottom: `0.5 solid ${PDF_COLORS.border}`,
  },
  paymentsTableRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  // ── Free Lot ──
  freeLotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeLotLabel: {
    fontSize: 8,
    color: PDF_COLORS.secondary,
  },
  freeLotValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.primary,
  },

  // ── Notes ──
  notesText: {
    fontSize: 8.5,
    color: PDF_COLORS.primary,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },

  // ── Page Footer ──
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: `0.5 solid ${PDF_COLORS.border}`,
  },
  footerText: {
    fontSize: 7,
    color: PDF_COLORS.muted,
  },

  // ── Summary Totals (last page) ──
  totalsCard: {
    marginTop: 16,
    borderRadius: 6,
    border: `1.5 solid ${PDF_COLORS.accentBlue}`,
  },
  totalsHeader: {
    backgroundColor: PDF_COLORS.accentBlueBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottom: `1 solid #dbeafe`,
  },
  totalsHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.accentBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  totalsCell: {
    flex: 1,
    flexDirection: 'column',
  },
  totalsCellLabel: {
    fontSize: 7,
    color: PDF_COLORS.muted,
    marginBottom: 3,
  },
  totalsCellValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.primary,
  },
  totalsCellCount: {
    fontSize: 8,
    color: PDF_COLORS.secondary,
    marginTop: 2,
  },

  // ── No data ──
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: PDF_COLORS.muted,
  },
});

// ─── Helper functions ──────────────────────────────────────────────────────────

function getStatusColor(status: LoanStatus): string {
  switch (status) {
    case 'Fully Funded': return PDF_COLORS.fullyFunded;
    case 'Partially Funded': return PDF_COLORS.partiallyFunded;
    case 'Completed': return PDF_COLORS.completed;
    case 'Overdue': return PDF_COLORS.overdue;
    default: return PDF_COLORS.secondary;
  }
}

function getTypeColor(type: LoanType): string {
  switch (type) {
    case 'Lot Title': return PDF_COLORS.lotTitle;
    case 'OR/CR': return PDF_COLORS.orcr;
    case 'Agent': return PDF_COLORS.agent;
    default: return PDF_COLORS.secondary;
  }
}

function getPeriodStatusColor(status: InterestPeriodStatus): string {
  switch (status) {
    case 'Completed': return PDF_COLORS.completed;
    case 'Overdue': return PDF_COLORS.overdue;
    case 'Pending': return PDF_COLORS.pending;
    case 'Incomplete': return PDF_COLORS.incomplete;
    default: return PDF_COLORS.secondary;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: LoanStatus }) => (
  <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
    <Text style={{ color: PDF_COLORS.white, fontSize: 7.5 }}>{status}</Text>
  </View>
);

const TypeBadge = ({ type }: { type: LoanType }) => (
  <View style={[styles.badge, { backgroundColor: getTypeColor(type) + '22', border: `1 solid ${getTypeColor(type)}` }]}>
    <Text style={{ color: getTypeColor(type), fontSize: 7.5 }}>{type}</Text>
  </View>
);

const PeriodStatusBadge = ({ status }: { status: InterestPeriodStatus }) => (
  <View style={[styles.badge, { backgroundColor: getPeriodStatusColor(status) }]}>
    <Text style={{ color: PDF_COLORS.white, fontSize: 6.5 }}>{status}</Text>
  </View>
);

// ─── Main Loan Card Component ──────────────────────────────────────────────────

const LoanCard = ({
  loan,
  enabledSections,
  isFirst,
  isLast,
}: {
  loan: LoanWithInvestors;
  enabledSections: Set<string>;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const stats = calculateLoanStats(loan);
  const showFinancial = enabledSections.has('financial_summary');
  const showInvestors = enabledSections.has('investors');
  const showPeriods = enabledSections.has('interest_periods');
  const showPayments = enabledSections.has('received_payments');
  const showFreeLot = enabledSections.has('free_lot');
  const showNotes = enabledSections.has('notes');

  const hasFreeLot = loan.freeLotSqm != null && loan.freeLotSqm > 0;
  const hasNotes = loan.notes && loan.notes.trim().length > 0;

  // Pre-determine which sections are visible so we know which is last (for border removal)
  const visibleSectionKeys: string[] = [];
  if (showFinancial) visibleSectionKeys.push('financial_summary');
  if (showInvestors && loan.loanInvestors.length > 0) visibleSectionKeys.push('investors');
  if (showFreeLot && hasFreeLot) visibleSectionKeys.push('free_lot');
  if (showNotes && hasNotes) visibleSectionKeys.push('notes');

  const sectionStyle = (key: string) =>
    visibleSectionKeys[visibleSectionKeys.length - 1] === key
      ? styles.sectionNoBorder
      : styles.section;

  return (
    <View style={[styles.loanCard, isLast ? { marginBottom: 0 } : {}]} break={!isFirst}>
      {/* Loan Header — keep on one line, never split */}
      <View style={styles.loanHeader} wrap={false}>
        <View style={styles.loanHeaderLeft}>
          <Text style={styles.loanName}>{loan.loanName}</Text>
        </View>
        <View style={styles.loanHeaderRight}>
          <TypeBadge type={loan.type} />
          <StatusBadge status={loan.status} />
        </View>
      </View>

      {/* No sections enabled */}
      {visibleSectionKeys.length === 0 && (
        <View style={styles.sectionNoBorder}>
          <Text style={{ fontSize: 8, color: PDF_COLORS.muted }}>No additional sections enabled.</Text>
        </View>
      )}

      {/* Financial Summary — keep label + grid together */}
      {showFinancial && (() => {
        const totalReceived = loan.loanInvestors.reduce(
          (sum, li) =>
            sum +
            (li.receivedPayments || []).reduce(
              (t, rp) => t + (parseFloat(rp.amount) || 0),
              0,
            ),
          0,
        );
        const totalBalance = stats.totalAmount - totalReceived;
        const isFullyPaid = totalBalance <= 0;

        return (
          <View style={sectionStyle('financial_summary')} wrap={false}>
            <Text style={styles.sectionLabel}>Financial Summary</Text>
            {/* Row 1: Principal / Rate / Interest / Final Due Date */}
            <View style={styles.financialGrid}>
              <View style={styles.financialCell}>
                <Text style={styles.financialCellLabel}>Total Principal</Text>
                <Text style={styles.financialCellValue}>{formatCurrencyForPDF(stats.totalPrincipal)}</Text>
              </View>
              <View style={styles.financialCell}>
                <Text style={styles.financialCellLabel}>Avg Rate</Text>
                <Text style={styles.financialCellValueSmall}>{stats.avgRate.toFixed(2)}%</Text>
              </View>
              <View style={styles.financialCell}>
                <Text style={styles.financialCellLabel}>Total Interest</Text>
                <Text style={styles.financialCellValue}>{formatCurrencyForPDF(stats.totalInterest)}</Text>
              </View>
              <View style={styles.financialCell}>
                <Text style={styles.financialCellLabel}>Final Due Date</Text>
                <Text style={styles.financialCellValueSmall}>{formatDateForPDF(loan.dueDate)}</Text>
              </View>
            </View>
            {/* Row 2: three equal columns (~33% each), full width */}
            <View style={[styles.financialGrid, { marginTop: 6 }]}>
              <View style={[styles.financialCell, { backgroundColor: PDF_COLORS.accentBlueBg, border: '1 solid #dbeafe' }]}>
                <Text style={styles.financialCellLabel}>Total Amount</Text>
                <Text style={[styles.financialCellValue, { color: PDF_COLORS.accentBlue }]}>
                  {formatCurrencyForPDF(stats.totalAmount)}
                </Text>
              </View>
              <View style={[styles.financialCell, { backgroundColor: '#f0fdf4', border: '1 solid #bbf7d0' }]}>
                <Text style={styles.financialCellLabel}>Total Received</Text>
                <Text style={[styles.financialCellValue, { color: PDF_COLORS.fullyFunded }]}>
                  {formatCurrencyForPDF(totalReceived)}
                </Text>
              </View>
              <View style={[
                styles.financialCell,
                isFullyPaid
                  ? { backgroundColor: '#f0fdf4', border: '1 solid #bbf7d0' }
                  : { backgroundColor: '#fff7ed', border: '1 solid #fed7aa' },
              ]}>
                <Text style={styles.financialCellLabel}>Balance Remaining</Text>
                <Text style={[
                  styles.financialCellValue,
                  { color: isFullyPaid ? PDF_COLORS.fullyFunded : PDF_COLORS.lotTitle },
                ]}>
                  {formatCurrencyForPDF(Math.max(0, totalBalance))}
                </Text>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Investor Breakdown */}
      {showInvestors && loan.loanInvestors.length > 0 && (
        <View style={sectionStyle('investors')}>
          <Text style={styles.sectionLabel}>Investor Breakdown</Text>
          {loan.loanInvestors.map((li, liIdx) => {
            const isLastInvestor = liIdx === loan.loanInvestors.length - 1;
            const interest = calculateInterest(li.amount, li.interestRate, li.interestType);
            const principal = parseFloat(li.amount) || 0;
            const total = principal + interest;
            const isFixed = li.interestType === 'fixed';
            const hasPeriods = showPeriods && li.hasMultipleInterest && li.interestPeriods && li.interestPeriods.length > 0;

            // For multi-interest investors, only show payments that are linked to a period
            // (interestPeriodId != null). Unlinked payments are orphaned/stale data.
            // For single-interest investors, show all payments.
            const visiblePayments = (li.receivedPayments || []).filter((rp) =>
              li.hasMultipleInterest ? rp.interestPeriodId != null : true,
            );
            const hasPayments = showPayments && visiblePayments.length > 0;

            return (
              <View
                key={li.id}
                style={isLastInvestor ? styles.investorBlockLast : styles.investorBlock}
              >
                {/* Investor header + key figures — keep together, never split these two rows */}
                <View wrap={false}>
                  <View style={styles.investorHeader}>
                    <Text style={styles.investorName}>{li.investor.name}</Text>
                  </View>

                  {/* Investor financial details — includes Sent Date as a proper field */}
                  <View style={styles.investorDetails}>
                    <View style={styles.investorDetailItem}>
                      <Text style={styles.investorDetailLabel}>Sent Date</Text>
                      <Text style={styles.investorDetailValue}>{formatDateForPDF(li.sentDate)}</Text>
                    </View>
                    <View style={styles.investorDetailItem}>
                      <Text style={styles.investorDetailLabel}>Principal</Text>
                      <Text style={styles.investorDetailValue}>{formatCurrencyForPDF(li.amount)}</Text>
                    </View>
                    <View style={styles.investorDetailItem}>
                      <Text style={styles.investorDetailLabel}>Rate</Text>
                      <Text style={styles.investorDetailValue}>
                        {isFixed ? 'Fixed' : `${parseFloat(li.interestRate).toFixed(2)}%`}
                      </Text>
                    </View>
                    <View style={styles.investorDetailItem}>
                      <Text style={styles.investorDetailLabel}>Interest</Text>
                      <Text style={styles.investorDetailValue}>{formatCurrencyForPDF(interest)}</Text>
                    </View>
                    <View style={styles.investorDetailItem}>
                      <Text style={styles.investorDetailLabel}>Total</Text>
                      <Text style={[styles.investorDetailValue, { color: PDF_COLORS.accentBlue }]}>
                        {formatCurrencyForPDF(total)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Interest Periods */}
                {hasPeriods && li.interestPeriods && (
                  <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
                    <Text style={styles.periodsLabel}>Interest Periods</Text>
                    <View style={styles.periodTable}>
                      <View style={styles.periodTableHeader}>
                        <Text style={[styles.periodTableHeaderCell, { flex: 0.6 }]}>#</Text>
                        <Text style={[styles.periodTableHeaderCell, { flex: 2 }]}>Due Date</Text>
                        <Text style={[styles.periodTableHeaderCell, { flex: 1.5 }]}>Rate / Amount</Text>
                        <Text style={[styles.periodTableHeaderCell, { flex: 1.5 }]}>Status</Text>
                      </View>
                      {[...li.interestPeriods]
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((period, pIdx) => {
                        const isLastPeriod = pIdx === li.interestPeriods!.length - 1;
                        const periodIsFixed = period.interestType === 'fixed';
                        const periodRate = parseFloat(period.interestRate);
                        const periodPrincipal = parseFloat(li.amount) || 0;
                        const periodInterest = periodIsFixed
                          ? periodRate
                          : periodPrincipal * (periodRate / 100);
                        const rateDisplay = periodIsFixed
                          ? formatCurrencyForPDF(periodInterest)
                          : `${periodRate.toFixed(2)}% (${formatCurrencyForPDF(periodInterest)})`;

                        return (
                          <View
                            key={period.id}
                            style={isLastPeriod ? styles.periodTableRowLast : styles.periodTableRow}
                            wrap={false}
                          >
                            <Text style={[styles.periodTableCell, { flex: 0.6, color: PDF_COLORS.muted }]}>
                              {pIdx + 1}
                            </Text>
                            <Text style={[styles.periodTableCell, { flex: 2 }]}>
                              {formatDateForPDF(period.dueDate)}
                            </Text>
                            <Text style={[styles.periodTableCell, { flex: 1.5 }]}>
                              {rateDisplay}
                            </Text>
                            <View style={styles.periodStatusCell}>
                              <PeriodStatusBadge status={period.status} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Received Payments — only period-linked payments for multi-interest */}
                {hasPayments && (
                  <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
                    <Text style={styles.periodsLabel}>Received Payments</Text>
                    <View style={styles.paymentsTable}>
                      <View style={styles.paymentsTableHeader}>
                        <Text style={[styles.periodTableHeaderCell, { flex: 2 }]}>Date</Text>
                        <Text style={[styles.periodTableHeaderCell, { flex: 2 }]}>Amount</Text>
                      </View>
                      {visiblePayments.map((payment, rIdx) => {
                        const isLastPayment = rIdx === visiblePayments.length - 1;
                        return (
                          <View
                            key={payment.id}
                            style={isLastPayment ? styles.paymentsTableRowLast : styles.paymentsTableRow}
                            wrap={false}
                          >
                            <Text style={[styles.periodTableCell, { flex: 2 }]}>
                              {formatDateForPDF(payment.receivedDate)}
                            </Text>
                            <Text style={[styles.periodTableCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>
                              {formatCurrencyForPDF(payment.amount)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Free Lot */}
      {showFreeLot && hasFreeLot && (
        <View style={sectionStyle('free_lot')}>
          <Text style={styles.sectionLabel}>Free Lot</Text>
          <View style={styles.freeLotRow}>
            <Text style={styles.freeLotValue}>{loan.freeLotSqm?.toLocaleString()}</Text>
            <Text style={styles.freeLotLabel}>square meters</Text>
          </View>
        </View>
      )}

      {/* Notes — label always stays with first line of text */}
      {showNotes && hasNotes && (
        <View style={sectionStyle('notes')}>
          <Text style={styles.sectionLabel} minPresenceAhead={20}>Notes</Text>
          <Text style={styles.notesText}>{loan.notes}</Text>
        </View>
      )}
    </View>
  );
};

// ─── PDF Document Component ────────────────────────────────────────────────────

interface LoansPDFDocumentProps {
  data: LoanWithInvestors[];
  enabledSections: string[];
  generatedAt?: Date;
}

const LoansPDFDocument = ({
  data,
  enabledSections,
  generatedAt = new Date(),
}: LoansPDFDocumentProps) => {
  const enabledSet = new Set(enabledSections);

  // Compute grand totals
  const grandTotalPrincipal = data.reduce((sum, loan) => {
    const stats = calculateLoanStats(loan);
    return sum + stats.totalPrincipal;
  }, 0);
  const grandTotalInterest = data.reduce((sum, loan) => {
    const stats = calculateLoanStats(loan);
    return sum + stats.totalInterest;
  }, 0);
  const grandTotalAmount = grandTotalPrincipal + grandTotalInterest;

  const statusCounts = data.reduce(
    (acc, loan) => {
      acc[loan.status] = (acc[loan.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const dateStr = formatDateForPDF(generatedAt);
  const timeStr = generatedAt.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document
      title="Loan Report — Pawn Tracker"
      author="Pawn Tracker"
      creator="Pawn Tracker"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page}>
        {/* Page header: not `fixed` — only on first page (fixed repeats on every page) */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.brandName}>PAWN TRACKER</Text>
            <Text style={styles.reportTitle}>Loan Report</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.reportDate}>Generated: {dateStr} {timeStr}</Text>
            <Text style={styles.reportCount}>{data.length} loan{data.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Loan Cards */}
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No loans to display.</Text>
          </View>
        ) : (
          data.map((loan, idx) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              enabledSections={enabledSet}
              isFirst={idx === 0}
              isLast={idx === data.length - 1}
            />
          ))
        )}

        {/* Grand Totals Card */}
        {data.length > 0 && (
          <View style={styles.totalsCard} wrap={false}>
            <View style={styles.totalsHeader}>
              <Text style={styles.totalsHeaderText}>Grand Totals — {data.length} Loan{data.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.totalsGrid}>
              <View style={styles.totalsCell}>
                <Text style={styles.totalsCellLabel}>Total Principal</Text>
                <Text style={styles.totalsCellValue}>{formatCurrencyForPDF(grandTotalPrincipal)}</Text>
              </View>
              <View style={styles.totalsCell}>
                <Text style={styles.totalsCellLabel}>Total Interest</Text>
                <Text style={styles.totalsCellValue}>{formatCurrencyForPDF(grandTotalInterest)}</Text>
              </View>
              <View style={styles.totalsCell}>
                <Text style={styles.totalsCellLabel}>Total Amount</Text>
                <Text style={[styles.totalsCellValue, { color: PDF_COLORS.accentBlue }]}>
                  {formatCurrencyForPDF(grandTotalAmount)}
                </Text>
              </View>
              <View style={styles.totalsCell}>
                <Text style={styles.totalsCellLabel}>By Status</Text>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Text key={status} style={styles.totalsCellCount}>
                    {status}: {count}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Page Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>
            Pawn Tracker — Confidential
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

// ─── Export helper ─────────────────────────────────────────────────────────────

/**
 * Generates and downloads a PDF for the given loans data.
 */
export async function renderLoansPDF(
  data: LoanWithInvestors[],
  enabledSectionKeys: string[],
): Promise<void> {
  const blob = await pdf(
    <LoansPDFDocument data={data} enabledSections={enabledSectionKeys} />
  ).toBlob();
  const timestamp = formatDateForPDF(new Date()).replace(/\//g, '-');
  downloadBlob(blob, `loans_${timestamp}.pdf`);
}
