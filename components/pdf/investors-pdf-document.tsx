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
  calculateInvestorStats,
  calculateAverageRate,
} from '@/lib/calculations';
import { InvestorWithLoans } from '@/lib/types';

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
  reportDate: {
    fontSize: 9,
    color: PDF_COLORS.secondary,
  },
  reportCount: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 2,
  },

  // ── Table ──
  table: {
    border: `1 solid ${PDF_COLORS.border}`,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.sectionBg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottom: `1.5 solid ${PDF_COLORS.border}`,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottom: `0.5 solid ${PDF_COLORS.border}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottom: `0.5 solid ${PDF_COLORS.border}`,
    backgroundColor: PDF_COLORS.background,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 8.5,
    color: PDF_COLORS.primary,
  },
  tableCellBold: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.primary,
  },
  tableCellMuted: {
    fontSize: 7.5,
    color: PDF_COLORS.muted,
  },

  // ── Totals Row ──
  totalsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: PDF_COLORS.accentBlueBg,
    borderTop: `1.5 solid ${PDF_COLORS.accentBlue}`,
  },
  totalsCellLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.accentBlue,
  },
  totalsCellValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.accentBlue,
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

  // ── Empty state ──
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: PDF_COLORS.muted,
  },
});

// ─── Column widths ─────────────────────────────────────────────────────────────

function buildColumns(enabledSections: Set<string>) {
  const cols: Array<{ key: string; label: string; flex: number }> = [
    { key: 'name', label: 'Name', flex: 2 },
  ];
  if (enabledSections.has('contact')) {
    cols.push({ key: 'email', label: 'Email', flex: 2.5 });
    cols.push({ key: 'phone', label: 'Phone', flex: 1.5 });
  }
  if (enabledSections.has('financial_stats')) {
    cols.push({ key: 'capital', label: 'Capital', flex: 1.5 });
    cols.push({ key: 'interest', label: 'Interest', flex: 1.5 });
    cols.push({ key: 'balance', label: 'Balance', flex: 1.5 });
    cols.push({ key: 'gain', label: 'Gain', flex: 1.5 });
  }
  if (enabledSections.has('loan_counts')) {
    cols.push({ key: 'active', label: 'Active', flex: 0.8 });
    cols.push({ key: 'completed', label: 'Done', flex: 0.8 });
    cols.push({ key: 'overdue', label: 'Overdue', flex: 0.8 });
    cols.push({ key: 'total', label: 'Total', flex: 0.8 });
  }
  return cols;
}

// ─── PDF Document Component ────────────────────────────────────────────────────

interface InvestorsPDFDocumentProps {
  data: InvestorWithLoans[];
  enabledSections: string[];
  generatedAt?: Date;
}

const InvestorsPDFDocument = ({
  data,
  enabledSections,
  generatedAt = new Date(),
}: InvestorsPDFDocumentProps) => {
  const enabledSet = new Set(enabledSections);
  const cols = buildColumns(enabledSet);

  const dateStr = formatDateForPDF(generatedAt);
  const timeStr = generatedAt.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Grand totals
  let totalCapital = 0, totalInterest = 0, totalBalance = 0, totalGain = 0;
  let totalActive = 0, totalCompleted = 0, totalOverdue = 0, totalLoans = 0;
  data.forEach((inv) => {
    const stats = calculateInvestorStats(inv);
    totalCapital += stats.totalCapital;
    totalInterest += stats.totalInterest;
    totalBalance += stats.currentBalance;
    totalGain += stats.totalGain;
    totalActive += stats.activeLoans;
    totalCompleted += stats.completedLoans;
    totalOverdue += stats.overdueLoans;
    totalLoans += stats.totalLoans;
  });

  function getCellValue(investor: InvestorWithLoans, key: string): string {
    const stats = calculateInvestorStats(investor);
    const avgRate = calculateAverageRate(investor.loanInvestors);
    switch (key) {
      case 'name': return investor.name;
      case 'email': return investor.email || '—';
      case 'phone': return investor.contactNumber || '—';
      case 'capital': return formatCurrencyForPDF(stats.totalCapital);
      case 'rate': return `${avgRate.toFixed(2)}%`;
      case 'interest': return formatCurrencyForPDF(stats.totalInterest);
      case 'balance': return formatCurrencyForPDF(stats.currentBalance);
      case 'gain': return formatCurrencyForPDF(stats.totalGain);
      case 'active': return String(stats.activeLoans);
      case 'completed': return String(stats.completedLoans);
      case 'overdue': return String(stats.overdueLoans);
      case 'total': return String(stats.totalLoans);
      default: return '—';
    }
  }

  function getTotalsValue(key: string): string {
    switch (key) {
      case 'name': return 'TOTAL';
      case 'email': return '';
      case 'phone': return '';
      case 'capital': return formatCurrencyForPDF(totalCapital);
      case 'interest': return formatCurrencyForPDF(totalInterest);
      case 'balance': return formatCurrencyForPDF(totalBalance);
      case 'gain': return formatCurrencyForPDF(totalGain);
      case 'active': return String(totalActive);
      case 'completed': return String(totalCompleted);
      case 'overdue': return String(totalOverdue);
      case 'total': return String(totalLoans);
      default: return '';
    }
  }

  return (
    <Document
      title="Investor Report — Pawn Tracker"
      author="Pawn Tracker"
      creator="Pawn Tracker"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Page Header */}
        <View style={styles.pageHeader} fixed>
          <View>
            <Text style={styles.brandName}>PAWN TRACKER</Text>
            <Text style={styles.reportTitle}>Investor Report</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.reportDate}>Generated: {dateStr} {timeStr}</Text>
            <Text style={styles.reportCount}>{data.length} investor{data.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Table */}
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No investors to display.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader} fixed>
              {cols.map((col) => (
                <Text
                  key={col.key}
                  style={[styles.tableHeaderCell, { flex: col.flex }]}
                >
                  {col.label}
                </Text>
              ))}
            </View>

            {/* Data rows */}
            {data.map((investor, idx) => {
              const isLast = idx === data.length - 1;
              const isAlt = idx % 2 === 1;
              const rowStyle = isLast ? styles.tableRowLast : isAlt ? styles.tableRowAlt : styles.tableRow;

              return (
                <View key={investor.id} style={rowStyle}>
                  {cols.map((col) => (
                    <Text
                      key={col.key}
                      style={[
                        col.key === 'name' ? styles.tableCellBold : styles.tableCell,
                        { flex: col.flex },
                      ]}
                    >
                      {getCellValue(investor, col.key)}
                    </Text>
                  ))}
                </View>
              );
            })}

            {/* Totals row */}
            <View style={styles.totalsRow}>
              {cols.map((col) => (
                <Text
                  key={col.key}
                  style={[styles.totalsCellValue, { flex: col.flex }]}
                >
                  {getTotalsValue(col.key)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Page Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>Pawn Tracker — Confidential</Text>
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

export async function renderInvestorsPDF(
  data: InvestorWithLoans[],
  enabledSectionKeys: string[],
): Promise<void> {
  const blob = await pdf(
    <InvestorsPDFDocument data={data} enabledSections={enabledSectionKeys} />
  ).toBlob();
  const timestamp = formatDateForPDF(new Date()).replace(/\//g, '-');
  downloadBlob(blob, `investors_${timestamp}.pdf`);
}
