import { randomBytes } from 'crypto';
import type { ContractCustomization } from './loan-contract-customization';
import {
  buildDefaultContractCustomizationFromLoan,
  type ContractCustomization as ContractCustomizationType,
} from './loan-contract-customization';
import {
  buildLoanContractData,
  type LoanContractData,
} from './loan-contract-data';
import type { LoanWithInvestors } from './types';

export type SigningPartyRole = 'borrower' | 'lender' | 'witness_1' | 'witness_2';

export interface SigningInvitationRecord {
  id: number;
  token: string;
  partyRole: SigningPartyRole;
  investorId: number | null;
  partyName: string;
  partyEmail: string | null;
  signatureDataUrl: string | null;
  signedAt: Date | string | null;
  consentedAt: Date | string | null;
  expiresAt: Date | string;
}

export interface SigningInvitationSummary {
  id: number;
  token: string;
  partyRole: SigningPartyRole;
  partyName: string;
  partyEmail: string | null;
  signedAt: string | null;
  expiresAt: string;
  signingUrl: string;
}

const SIGNING_LINK_EXPIRY_DAYS = 30;
const MAX_SIGNATURE_DATA_URL_LENGTH = 600_000;

export function generateSigningToken(): string {
  return randomBytes(32).toString('hex');
}

export function getSigningExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SIGNING_LINK_EXPIRY_DAYS);
  return expiresAt;
}

export function buildSigningUrl(token: string, origin?: string): string {
  const base = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (base) {
    return `${base.replace(/\/$/, '')}/sign/${token}`;
  }
  return `/sign/${token}`;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export function emailsMatch(
  provided: string,
  expected: string | null | undefined,
): boolean {
  const normalizedExpected = normalizeEmail(expected);
  if (!normalizedExpected) return true;
  return normalizeEmail(provided) === normalizedExpected;
}

export function isValidSignatureDataUrl(value: string): boolean {
  if (!value.startsWith('data:image/png;base64,')) return false;
  if (value.length > MAX_SIGNATURE_DATA_URL_LENGTH) return false;
  const base64 = value.slice('data:image/png;base64,'.length);
  return base64.length > 100;
}

export function resolveContractCustomization(
  loan: LoanWithInvestors,
  storedCustomization?: ContractCustomizationType | null,
): ContractCustomization {
  if (storedCustomization) {
    return storedCustomization;
  }
  const data = buildLoanContractData(loan);
  return buildDefaultContractCustomizationFromLoan(data);
}

export function applySigningSignatures(
  data: LoanContractData,
  customization: ContractCustomization,
  invitations: SigningInvitationRecord[],
  investorEmailById: Map<number, string>,
): { data: LoanContractData; customization: ContractCustomization } {
  const nextData: LoanContractData = {
    ...data,
    lenders: data.lenders.map((lender) => ({ ...lender })),
  };
  const nextCustomization: ContractCustomization = {
    ...customization,
    lenderDateSigned: { ...customization.lenderDateSigned },
  };

  for (const invitation of invitations) {
    if (!invitation.signatureDataUrl) continue;

    const signedDate =
      invitation.signedAt != null
        ? new Date(invitation.signedAt).toISOString().slice(0, 10)
        : undefined;

    switch (invitation.partyRole) {
      case 'borrower':
        nextData.borrowerESignatureUrl = invitation.signatureDataUrl;
        if (signedDate) {
          nextCustomization.borrowerDateSigned = signedDate;
        }
        break;
      case 'lender': {
        const lenderEmail =
          invitation.investorId != null
            ? investorEmailById.get(invitation.investorId)
            : undefined;
        if (!lenderEmail) break;

        nextData.lenders = nextData.lenders.map((lender) =>
          lender.email === lenderEmail
            ? { ...lender, eSignatureUrl: invitation.signatureDataUrl }
            : lender,
        );
        if (signedDate) {
          nextCustomization.lenderDateSigned[lenderEmail] = signedDate;
        }
        break;
      }
      case 'witness_1':
        nextCustomization.witness1ESignatureUrl = invitation.signatureDataUrl;
        if (signedDate) {
          nextCustomization.witness1DateSigned = signedDate;
        }
        break;
      case 'witness_2':
        nextCustomization.witness2ESignatureUrl = invitation.signatureDataUrl;
        if (signedDate) {
          nextCustomization.witness2DateSigned = signedDate;
        }
        break;
    }
  }

  return { data: nextData, customization: nextCustomization };
}

export function applyLiveSignaturePreview(
  data: LoanContractData,
  customization: ContractCustomization,
  partyRole: SigningPartyRole,
  signatureDataUrl: string | null | undefined,
  partyEmail?: string | null,
): { data: LoanContractData; customization: ContractCustomization } {
  if (!signatureDataUrl) {
    return { data, customization };
  }

  const nextData: LoanContractData = {
    ...data,
    lenders: data.lenders.map((lender) => ({ ...lender })),
  };
  const nextCustomization: ContractCustomization = {
    ...customization,
    lenderDateSigned: { ...customization.lenderDateSigned },
  };

  switch (partyRole) {
    case 'borrower':
      nextData.borrowerESignatureUrl = signatureDataUrl;
      break;
    case 'lender':
      if (partyEmail) {
        nextData.lenders = nextData.lenders.map((lender) =>
          lender.email === partyEmail
            ? { ...lender, eSignatureUrl: signatureDataUrl }
            : lender,
        );
      }
      break;
    case 'witness_1':
      nextCustomization.witness1ESignatureUrl = signatureDataUrl;
      break;
    case 'witness_2':
      nextCustomization.witness2ESignatureUrl = signatureDataUrl;
      break;
  }

  return { data: nextData, customization: nextCustomization };
}

export function signingPartyRoleMatchesBlock(
  partyRole: SigningPartyRole,
  blockRole: string,
  partyEmail?: string | null,
  blockEmail?: string | null,
): boolean {
  switch (partyRole) {
    case 'borrower':
      return blockRole === 'Borrower';
    case 'lender':
      return (
        (blockRole === 'Lender' || blockRole.startsWith('Lender ')) &&
        Boolean(partyEmail && partyEmail === blockEmail)
      );
    case 'witness_1':
      return blockRole === 'Witness 1';
    case 'witness_2':
      return blockRole === 'Witness 2';
    default:
      return false;
  }
}

export function buildInvestorEmailMap(
  loan: LoanWithInvestors,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const li of loan.loanInvestors) {
    if (!map.has(li.investorId)) {
      map.set(li.investorId, li.investor.email);
    }
  }
  return map;
}

export interface CreateSigningInvitationInput {
  loanId: number;
  contractId: number;
  partyRole: SigningPartyRole;
  partyName: string;
  partyEmail?: string | null;
  investorId?: number | null;
  witnessId?: number | null;
}

export function getWitnessInvitationPartyName(
  witnessRole: 'witness_1' | 'witness_2',
  customization: ContractCustomization,
): string {
  const name =
    witnessRole === 'witness_1'
      ? customization.witness1Name.trim()
      : customization.witness2Name.trim();

  if (name) {
    return name;
  }

  return witnessRole === 'witness_1' ? 'Witness 1' : 'Witness 2';
}

export function resolveSigningPartyDisplayName(
  partyRole: SigningPartyRole,
  partyName: string,
  customization?: ContractCustomization | null,
): string {
  switch (partyRole) {
    case 'witness_1':
    case 'witness_2':
      if (customization) {
        return getWitnessInvitationPartyName(partyRole, customization);
      }
      return partyName.trim() || (partyRole === 'witness_1' ? 'Witness 1' : 'Witness 2');
    default:
      return partyName;
  }
}

export function buildSigningInvitationsForLoan(
  loan: LoanWithInvestors,
  contractId: number,
  customization: ContractCustomization,
): CreateSigningInvitationInput[] {
  const expiresAt = getSigningExpiryDate();
  void expiresAt;

  const invitations: CreateSigningInvitationInput[] = [];

  if (loan.borrower) {
    invitations.push({
      loanId: loan.id,
      contractId,
      partyRole: 'borrower',
      partyName: loan.borrower.name,
      partyEmail: loan.borrower.email,
    });
  }

  const seenInvestorIds = new Set<number>();
  for (const li of loan.loanInvestors) {
    if (seenInvestorIds.has(li.investorId)) continue;
    seenInvestorIds.add(li.investorId);
    invitations.push({
      loanId: loan.id,
      contractId,
      partyRole: 'lender',
      partyName: li.investor.name,
      partyEmail: li.investor.email,
      investorId: li.investorId,
    });
  }

  if (customization.includeWitnesses) {
    invitations.push({
      loanId: loan.id,
      contractId,
      partyRole: 'witness_1',
      partyName: getWitnessInvitationPartyName('witness_1', customization),
      partyEmail: customization.witness1Email?.trim() || null,
      witnessId: customization.witness1Id ?? null,
    });

    const includeSecond =
      customization.includeSecondWitness ||
      Boolean(
        customization.witness2Name.trim() ||
          customization.witness2Address.trim() ||
          customization.witness2ValidIdUrl.trim() ||
          customization.witness2ESignatureUrl.trim(),
      );

    if (includeSecond) {
      invitations.push({
        loanId: loan.id,
        contractId,
        partyRole: 'witness_2',
        partyName: getWitnessInvitationPartyName('witness_2', customization),
        partyEmail: customization.witness2Email?.trim() || null,
        witnessId: customization.witness2Id ?? null,
      });
    }
  }

  return invitations;
}

export function isSigningInvitationIncluded(
  invitation: Pick<SigningInvitationRecord, 'partyRole' | 'investorId'>,
  _loan: LoanWithInvestors,
  customization: ContractCustomization,
): boolean {
  switch (invitation.partyRole) {
    case 'borrower':
    case 'lender':
      return true;
    case 'witness_1':
      return customization.includeWitnesses;
    case 'witness_2': {
      if (!customization.includeWitnesses) {
        return false;
      }
      return (
        customization.includeSecondWitness ||
        Boolean(
          customization.witness2Name.trim() ||
            customization.witness2Address.trim() ||
            customization.witness2ValidIdUrl.trim() ||
            customization.witness2ESignatureUrl.trim(),
        )
      );
    }
    default:
      return true;
  }
}

const SIGNING_ROLE_ORDER: Record<SigningPartyRole, number> = {
  borrower: 0,
  lender: 1,
  witness_1: 2,
  witness_2: 3,
};

export function sortSigningInvitations<
  T extends { id: number; partyRole: SigningPartyRole },
>(invitations: T[]): T[] {
  return [...invitations].sort((a, b) => {
    const roleDiff =
      SIGNING_ROLE_ORDER[a.partyRole] - SIGNING_ROLE_ORDER[b.partyRole];
    if (roleDiff !== 0) return roleDiff;
    return a.id - b.id;
  });
}

export function toSigningInvitationSummary(
  invitation: SigningInvitationRecord,
  origin?: string,
): SigningInvitationSummary {
  return {
    id: invitation.id,
    token: invitation.token,
    partyRole: invitation.partyRole,
    partyName: invitation.partyName,
    partyEmail: invitation.partyEmail,
    signedAt: invitation.signedAt
      ? new Date(invitation.signedAt).toISOString()
      : null,
    expiresAt: new Date(invitation.expiresAt).toISOString(),
    signingUrl: buildSigningUrl(invitation.token, origin),
  };
}
