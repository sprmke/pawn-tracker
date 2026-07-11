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
  Image,
} from '@react-pdf/renderer';
import { downloadBlob } from '@/lib/pdf-export';
import {
  buildLoanContractData,
  formatContractCurrency,
  formatContractDate,
  getContractDetailRows,
  getLoanContractFilename,
  type LoanContractData,
} from '@/lib/loan-contract-data';
import {
  applyContractCustomization,
  type ContractCustomization,
} from '@/lib/loan-contract-customization';
import {
  getContractIntroText,
  getContractSignaturePartiesForDisplay,
  getContractTermClauses,
  getWitnessAttestationText,
  shouldShowValidId,
  type SignaturePartyDetails,
} from '@/lib/loan-contract-content';
import type { LoanWithInvestors } from '@/lib/types';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.45,
    color: '#0f172a',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
  },
  header: {
    marginBottom: 16,
    borderBottom: '1.5 solid #3b82f6',
    paddingBottom: 10,
  },
  brand: {
    fontSize: 10,
    color: '#3b82f6',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#475569',
    marginTop: 3,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  paragraph: {
    marginBottom: 6,
    textAlign: 'justify',
    color: '#334155',
  },
  detailsGrid: {
    border: '1 solid #e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
  },
  detailRowLast: {
    flexDirection: 'row',
  },
  detailLabel: {
    width: '38%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    fontSize: 8,
  },
  detailValue: {
    width: '62%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
  },
  lenderBlock: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: '1 solid #e2e8f0',
  },
  lenderName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 2,
  },
  lenderMeta: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 1,
  },
  signatureSection: {
    marginTop: 14,
    paddingTop: 10,
    borderTop: '1 solid #cbd5e1',
  },
  signatureIntro: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  signatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  signatureBlock: {
    width: '47%',
    minWidth: 210,
    marginBottom: 14,
  },
  signatureLine: {
    borderBottom: '1 solid #0f172a',
    height: 22,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  signatureField: {
    fontSize: 7.5,
    color: '#64748b',
    marginBottom: 1,
  },
  validIdImage: {
    marginTop: 4,
    maxHeight: 72,
    maxWidth: '100%',
    objectFit: 'contain',
  },
  eSignatureImage: {
    marginBottom: 4,
    maxHeight: 48,
    maxWidth: '100%',
    objectFit: 'contain',
  },
  validIdPlaceholder: {
    fontSize: 7,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  legalNotice: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1 solid #e2e8f0',
    fontSize: 7,
    color: '#64748b',
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

function ContractDetailsGrid({ data }: { data: LoanContractData }) {
  const rows = getContractDetailRows(data);

  return (
    <View style={styles.detailsGrid}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={
            index === rows.length - 1 ? styles.detailRowLast : styles.detailRow
          }
        >
          <Text style={styles.detailLabel}>{row.label}</Text>
          <Text style={styles.detailValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function SignatureBlock({ party }: { party: SignaturePartyDetails }) {
  return (
    <View style={styles.signatureBlock}>
      {party.eSignatureUrl ? (
        <Image src={party.eSignatureUrl} style={styles.eSignatureImage} />
      ) : (
        <View style={styles.signatureLine} />
      )}
      <Text style={styles.signatureLabel}>{party.role} Signature</Text>
      <Text style={styles.signatureField}>
        Printed Name: {party.printedName}
      </Text>
      <Text style={styles.signatureField}>
        Address: {party.address?.trim() || '_________________________'}
      </Text>
      {shouldShowValidId(party) ? (
        <>
          <Text style={styles.signatureField}>Valid ID:</Text>
          {party.validIdUrl ? (
            <Image src={party.validIdUrl} style={styles.validIdImage} />
          ) : (
            <Text style={styles.validIdPlaceholder}>No valid ID uploaded</Text>
          )}
        </>
      ) : null}
      <Text style={styles.signatureField}>
        Date Signed: {party.dateSigned || '_________________'}
      </Text>
    </View>
  );
}

function LoanContractPDFDocument({
  data,
  customization,
}: {
  data: LoanContractData;
  customization?: ContractCustomization;
}) {
  const displayData = customization
    ? applyContractCustomization(data, customization)
    : data;
  const lenderNames =
    displayData.lenders.length > 0
      ? displayData.lenders.map((l) => l.name).join(', ')
      : '_________________________';
  const termClauses = getContractTermClauses(displayData, customization);
  const signatureParties = getContractSignaturePartiesForDisplay(
    displayData,
    customization,
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.brand}>PawnTracker</Text>
          <Text style={styles.title}>{displayData.contractTitle}</Text>
          <Text style={styles.subtitle}>
            Contract No. {displayData.contractNumber}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            {getContractIntroText(displayData, customization)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>BORROWER: </Text>
            {displayData.borrowerName}
          </Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>LENDER(S): </Text>
            {lenderNames}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Terms</Text>
          <ContractDetailsGrid data={displayData} />
        </View>

        {displayData.lenders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lender Allocation</Text>
            {displayData.lenders.map((lender) => (
              <View key={lender.email} style={styles.lenderBlock}>
                <Text style={styles.lenderName}>{lender.name}</Text>
                {lender.contactNumber ? (
                  <Text style={styles.lenderMeta}>
                    Contact: {lender.contactNumber}
                  </Text>
                ) : null}
                <Text style={styles.lenderMeta}>Email: {lender.email}</Text>
                <Text style={styles.lenderMeta}>
                  Principal: {formatContractCurrency(lender.principalAmount)}
                </Text>
                <Text style={styles.lenderMeta}>
                  Interest: {lender.interestDescription}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          {termClauses.map((clause, index) => (
            <Text key={index} style={styles.paragraph}>
              {index + 1}. {clause.text}
            </Text>
          ))}
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureIntro}>
            {getWitnessAttestationText(customization)}
          </Text>
          <View style={styles.signatureGrid}>
            {signatureParties.map((party) => (
              <SignatureBlock
                key={`${party.role}-${party.printedName}`}
                party={party}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by PawnTracker · {formatContractDate(new Date())}
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
}

export async function renderLoanContractPDF(
  loan: LoanWithInvestors,
  customization?: ContractCustomization,
  contractDataOverride?: LoanContractData,
): Promise<void> {
  const contractData = contractDataOverride ?? buildLoanContractData(loan);
  const blob = await pdf(
    <LoanContractPDFDocument
      data={contractData}
      customization={customization}
    />,
  ).toBlob();
  downloadBlob(blob, getLoanContractFilename(loan));
}

export { LoanContractPDFDocument };
