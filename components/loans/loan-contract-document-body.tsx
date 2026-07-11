'use client';

import { cn } from '@/lib/utils';
import {
  formatContractCurrency,
  formatContractDate,
  getContractDetailRows,
  type LoanContractData,
} from '@/lib/loan-contract-data';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import { applyContractCustomization } from '@/lib/loan-contract-customization';
import {
  getContractIntroText,
  getContractSignaturePartiesForDisplay,
  getContractTermClauses,
  getWitnessAttestationText,
  shouldShowValidId,
  type SignaturePartyDetails,
} from '@/lib/loan-contract-content';
import type { SigningPartyRole } from '@/lib/loan-signing';
import { signingPartyRoleMatchesBlock } from '@/lib/loan-signing';

function ContractDetailsTable({
  data,
  compact,
}: {
  data: LoanContractData;
  compact?: boolean;
}) {
  const rows = getContractDetailRows(data);
  const cellClass = compact
    ? 'px-2 py-1.5 text-[10px] sm:px-3 sm:py-2 sm:text-xs'
    : 'px-3 py-2 text-xs';

  return (
    <div className="overflow-hidden rounded-md border border-border">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            compact
              ? 'border-b border-border last:border-b-0'
              : `grid grid-cols-[38%_1fr] ${
                  index !== rows.length - 1 ? 'border-b border-border' : ''
                }`,
          )}
        >
          <div
            className={cn(
              cellClass,
              'bg-muted/60 font-medium text-muted-foreground',
            )}
          >
            {row.label}
          </div>
          <div className={cn(cellClass, 'text-foreground')}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function PartyNoticeBlock({
  party,
  isActive,
  showSigningStatus,
  compact,
}: {
  party: SignaturePartyDetails;
  isActive?: boolean;
  showSigningStatus?: boolean;
  compact?: boolean;
}) {
  const knownAddress = party.address?.trim();
  const isSigned = Boolean(party.eSignatureUrl);
  const metaClass = compact
    ? 'text-[10px] sm:text-xs text-muted-foreground'
    : 'text-xs text-muted-foreground';

  return (
    <div
      className={cn(
        'w-full min-w-0 flex-1 space-y-1 rounded-md p-2 transition-colors sm:min-w-[200px] md:min-w-[240px]',
        isActive
          ? 'bg-primary/5 ring-2 ring-primary/60'
          : isSigned
            ? 'bg-green-50/60'
            : '',
      )}
    >
      {showSigningStatus ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {party.role}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isSigned
                ? 'bg-green-100 text-green-800'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isSigned ? 'Signed' : 'Pending'}
          </span>
        </div>
      ) : null}
      {party.eSignatureUrl ? (
        <div className="mb-2 overflow-hidden rounded border border-border bg-white px-2 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={party.eSignatureUrl}
            alt={`${party.role} e-signature`}
            className="max-h-12 w-full object-contain object-left sm:max-h-16"
          />
        </div>
      ) : (
        <div className="mb-2 h-7 border-b border-foreground" />
      )}
      {!showSigningStatus ? (
        <p className={cn(metaClass, 'font-semibold text-foreground')}>
          {party.role} Signature
        </p>
      ) : null}
      <p className={metaClass}>Printed Name: {party.printedName}</p>
      <p className={metaClass}>
        Address: {knownAddress || '_________________________'}
      </p>
      {shouldShowValidId(party) ? (
        <div className="space-y-1 pt-1">
          <p className={metaClass}>Valid ID:</p>
          {party.validIdUrl ? (
            <div className="overflow-hidden rounded border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={party.validIdUrl}
                alt={`${party.role} valid ID`}
                className="max-h-24 w-full object-contain sm:max-h-32"
              />
            </div>
          ) : (
            <p className={cn(metaClass, 'italic')}>No valid ID uploaded</p>
          )}
        </div>
      ) : null}
      <p className={metaClass}>
        Date Signed: {party.dateSigned || '_________________'}
      </p>
    </div>
  );
}

export function LoanContractDocumentBody({
  data,
  customization,
  signingContext,
  variant = 'default',
}: {
  data: LoanContractData;
  customization?: ContractCustomization;
  signingContext?: {
    activePartyRole: SigningPartyRole;
    activePartyEmail?: string | null;
    showStatusBadges?: boolean;
  };
  variant?: 'default' | 'compact';
}) {
  const compact = variant === 'compact';
  const displayData = customization
    ? applyContractCustomization(data, customization)
    : data;
  const lenderNames =
    displayData.lenders.length > 0
      ? displayData.lenders.map((lender) => lender.name).join(', ')
      : '_________________________';
  const termClauses = getContractTermClauses(displayData, customization);
  const signatureParties = getContractSignaturePartiesForDisplay(
    displayData,
    customization,
    signingContext
      ? {
          shouldRevealSignature: (party) =>
            signingPartyRoleMatchesBlock(
              signingContext.activePartyRole,
              party.role,
              signingContext.activePartyEmail,
              party.email,
            ),
        }
      : undefined,
  );

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-3xl bg-background text-foreground',
        compact
          ? 'space-y-3 p-2.5 text-[11px] leading-snug sm:space-y-4 sm:p-4 sm:text-xs sm:leading-relaxed md:space-y-5 md:p-6 md:text-sm lg:p-8'
          : 'space-y-5 p-6 text-sm leading-relaxed sm:p-8',
      )}
    >
      <div className="border-b-2 border-primary pb-2 sm:pb-3">
        <p
          className={cn(
            'font-bold uppercase tracking-widest text-primary',
            compact ? 'text-[9px] sm:text-[10px] md:text-xs' : 'text-xs',
          )}
        >
          PawnTracker
        </p>
        <h3
          className={cn(
            'mt-1 font-bold',
            compact
              ? 'text-base sm:text-lg md:text-xl'
              : 'text-xl',
          )}
        >
          {displayData.contractTitle}
        </h3>
        <p
          className={cn(
            'text-muted-foreground',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs',
          )}
        >
          Contract No. {displayData.contractNumber}
        </p>
      </div>

      <p
        className={cn(
          'text-justify text-muted-foreground',
          compact && 'text-[11px] sm:text-xs md:text-sm',
        )}
      >
        {getContractIntroText(displayData, customization)}
      </p>

      <div className="space-y-1.5 sm:space-y-2">
        <p
          className={cn(
            'font-bold uppercase tracking-wide text-foreground',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs',
          )}
        >
          Parties
        </p>
        <p
          className={cn(
            'text-muted-foreground',
            compact && 'text-[11px] sm:text-xs md:text-sm',
          )}
        >
          <span className="font-semibold text-foreground">BORROWER: </span>
          {displayData.borrowerName}
        </p>
        <p
          className={cn(
            'text-muted-foreground',
            compact && 'text-[11px] sm:text-xs md:text-sm',
          )}
        >
          <span className="font-semibold text-foreground">LENDER(S): </span>
          {lenderNames}
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <p
          className={cn(
            'font-bold uppercase tracking-wide text-foreground',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs',
          )}
        >
          Loan Terms
        </p>
        <ContractDetailsTable data={displayData} compact={compact} />
      </div>

      {displayData.lenders.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <p
            className={cn(
              'font-bold uppercase tracking-wide text-foreground',
              compact ? 'text-[10px] sm:text-xs' : 'text-xs',
            )}
          >
            Lender Allocation
          </p>
          <div className="space-y-2">
            {displayData.lenders.map((lender) => (
              <div
                key={lender.email}
                className={cn(
                  'rounded-md border border-border bg-muted/40',
                  compact ? 'p-2 sm:p-3' : 'p-3',
                )}
              >
                <p
                  className={cn(
                    'font-semibold',
                    compact ? 'text-xs sm:text-sm' : 'text-sm',
                  )}
                >
                  {lender.name}
                </p>
                {lender.contactNumber ? (
                  <p className={compact ? 'text-[10px] sm:text-xs text-muted-foreground' : 'text-xs text-muted-foreground'}>
                    Contact: {lender.contactNumber}
                  </p>
                ) : null}
                <p className={compact ? 'text-[10px] sm:text-xs text-muted-foreground' : 'text-xs text-muted-foreground'}>
                  Email: {lender.email}
                </p>
                <p className={compact ? 'text-[10px] sm:text-xs text-muted-foreground' : 'text-xs text-muted-foreground'}>
                  Principal: {formatContractCurrency(lender.principalAmount)}
                </p>
                <p className={compact ? 'text-[10px] sm:text-xs text-muted-foreground' : 'text-xs text-muted-foreground'}>
                  Interest: {lender.interestDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5 sm:space-y-2">
        <p
          className={cn(
            'font-bold uppercase tracking-wide text-foreground',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs',
          )}
        >
          Terms and Conditions
        </p>
        <ol
          className={cn(
            'list-decimal space-y-2 pl-4 text-muted-foreground sm:space-y-3 sm:pl-5',
            compact && 'text-[11px] sm:text-xs md:text-sm',
          )}
        >
          {termClauses.map((clause, index) => (
            <li key={index} className="text-justify">
              {clause.text}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3 border-t border-border pt-3 sm:space-y-4 sm:pt-5">
        <p
          className={cn(
            'italic text-muted-foreground',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs',
          )}
        >
          {getWitnessAttestationText(customization)}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
          {signatureParties.map((party) => (
            <PartyNoticeBlock
              key={`${party.role}-${party.printedName}`}
              party={party}
              compact={compact}
              isActive={
                signingContext
                  ? signingPartyRoleMatchesBlock(
                      signingContext.activePartyRole,
                      party.role,
                      signingContext.activePartyEmail,
                      party.email,
                    )
                  : false
              }
              showSigningStatus={signingContext?.showStatusBadges}
            />
          ))}
        </div>
      </div>

      <p
        className={cn(
          'text-muted-foreground',
          compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px]',
        )}
      >
        Generated by PawnTracker · {formatContractDate(new Date())}
      </p>
    </div>
  );
}
