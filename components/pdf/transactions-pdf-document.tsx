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
import { TransactionWithInvestor, TransactionDirection } from '@/lib/types';

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
    paddingVertical: 7,
    borderBottom: `0.5 solid ${PDF_COLORS.border}`,
    alignItems: 'flex-start',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottom: `0.5 solid ${PDF_COLORS.border}`,
    backgroundColor: PDF_COLORS.background,
    alignItems: 'flex-start',
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'flex-start',
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
  tableCellNotes: {
    fontSize: 7.5,
    color: PDF_COLORS.secondary,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },

  // ── Direction Badge ──
  directionIn: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: PDF_COLORS.fullyFunded,
  },
  directionOut: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: PDF_COLORS.overdue,
  },
  directionText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.white,
  },

  // ── Type Badge ──
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: PDF_COLORS.sectionBg,
    border: `0.5 solid ${PDF_COLORS.border}`,
  },
  typeBadgeText: {
    fontSize: 7,
    color: PDF_COLORS.secondary,
  },

  // ── Totals Row ──
  totalsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: PDF_COLORS.accentBlueBg,
    borderTop: `1.5 solid ${PDF_COLORS.accentBlue}`,
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

// ─── Helper ────────────────────────────────────────────────────────────────────

const DirectionBadge = ({ direction }: { direction: TransactionDirection }) => (
  <View style={direction === 'In' ? styles.directionIn : styles.directionOut}>
    <Text style={styles.directionText}>{direction}</Text>
  </View>
);

function buildColumns(enabledSections: Set<string>) {
  const cols: Array<{ key: string; label: string; flex: number }> = [
    { key: 'date', label: 'Date', flex: 1.2 },
    { key: 'name', label: 'Name', flex: 2 },
  ];
  if (enabledSections.has('investor')) {
    cols.push({ key: 'investor', label: 'Investor', flex: 1.5 });
  }
  if (enabledSections.has('type_direction')) {
    cols.push({ key: 'type', label: 'Type', flex: 1.2 });
    cols.push({ key: 'direction', label: 'Dir', flex: 0.8 });
  }
  if (enabledSections.has('amount')) {
    cols.push({ key: 'amount', label: 'Amount', flex: 1.5 });
  }
  if (enabledSections.has('notes')) {
    cols.push({ key: 'notes', label: 'Notes', flex: 2.5 });
  }
  return cols;
}

// ─── PDF Document Component ────────────────────────────────────────────────────

interface TransactionsPDFDocumentProps {
  data: TransactionWithInvestor[];
  enabledSections: string[];
  generatedAt?: Date;
}

const TransactionsPDFDocument = ({
  data,
  enabledSections,
  generatedAt = new Date(),
}: TransactionsPDFDocumentProps) => {
  const enabledSet = new Set(enabledSections);
  const cols = buildColumns(enabledSet);
  const showAmount = enabledSet.has('amount');

  const dateStr = formatDateForPDF(generatedAt);
  const timeStr = generatedAt.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Grand total amount (In - Out)
  let totalIn = 0, totalOut = 0;
  data.forEach((tx) => {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.direction === 'In') totalIn += amt;
    else totalOut += amt;
  });

  function getCellValue(tx: TransactionWithInvestor, key: string) {
    switch (key) {
      case 'date': return formatDateForPDF(tx.date);
      case 'name': return tx.name;
      case 'investor': return tx.investor.name;
      case 'type': return tx.type;
      case 'amount': return formatCurrencyForPDF(tx.amount);
      case 'notes': return tx.notes || '—';
      default: return '—';
    }
  }

  function getTotalsValue(key: string): string {
    switch (key) {
      case 'date': return 'TOTAL';
      case 'amount': return `In: ${formatCurrencyForPDF(totalIn)}  Out: ${formatCurrencyForPDF(totalOut)}`;
      default: return '';
    }
  }

  return (
    <Document
      title="Transaction Report — Pawn Tracker"
      author="Pawn Tracker"
      creator="Pawn Tracker"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Page Header */}
        <View style={styles.pageHeader} fixed>
          <View>
            <Text style={styles.brandName}>PAWN TRACKER</Text>
            <Text style={styles.reportTitle}>Transaction Report</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.reportDate}>Generated: {dateStr} {timeStr}</Text>
            <Text style={styles.reportCount}>
              {data.length} transaction{data.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Table */}
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions to display.</Text>
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
            {data.map((tx, idx) => {
              const isLast = idx === data.length - 1;
              const isAlt = idx % 2 === 1;
              const rowStyle = isLast
                ? styles.tableRowLast
                : isAlt
                ? styles.tableRowAlt
                : styles.tableRow;

              return (
                <View key={tx.id} style={rowStyle}>
                  {cols.map((col) => {
                    if (col.key === 'direction') {
                      return (
                        <View key={col.key} style={{ flex: col.flex }}>
                          <DirectionBadge direction={tx.direction} />
                        </View>
                      );
                    }
                    if (col.key === 'type') {
                      return (
                        <View key={col.key} style={[{ flex: col.flex }]}>
                          <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{tx.type}</Text>
                          </View>
                        </View>
                      );
                    }
                    if (col.key === 'amount') {
                      return (
                        <Text
                          key={col.key}
                          style={[
                            styles.tableCellBold,
                            {
                              flex: col.flex,
                              color:
                                tx.direction === 'In'
                                  ? PDF_COLORS.fullyFunded
                                  : PDF_COLORS.overdue,
                            },
                          ]}
                        >
                          {tx.direction === 'In' ? '+' : '-'}
                          {getCellValue(tx, col.key)}
                        </Text>
                      );
                    }
                    if (col.key === 'notes') {
                      return (
                        <Text
                          key={col.key}
                          style={[styles.tableCellNotes, { flex: col.flex }]}
                        >
                          {getCellValue(tx, col.key)}
                        </Text>
                      );
                    }
                    return (
                      <Text
                        key={col.key}
                        style={[
                          col.key === 'name' ? styles.tableCellBold : styles.tableCell,
                          { flex: col.flex },
                        ]}
                      >
                        {getCellValue(tx, col.key)}
                      </Text>
                    );
                  })}
                </View>
              );
            })}

            {/* Totals row */}
            {showAmount && (
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
            )}
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

export async function renderTransactionsPDF(
  data: TransactionWithInvestor[],
  enabledSectionKeys: string[],
): Promise<void> {
  const blob = await pdf(
    <TransactionsPDFDocument data={data} enabledSections={enabledSectionKeys} />
  ).toBlob();
  const timestamp = formatDateForPDF(new Date()).replace(/\//g, '-');
  downloadBlob(blob, `transactions_${timestamp}.pdf`);
}
