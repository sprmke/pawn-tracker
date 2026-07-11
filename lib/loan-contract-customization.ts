import {
  buildLoanContractDataFromDraft,
  type LoanContractData,
  type LoanContractDraftInput,
} from './loan-contract-data';
import {
  CONTRACT_DISPUTE_VENUE,
  getContractTitle,
  getSecurityAndCollateralClause,
  buildDefaultSignatureDates,
} from './loan-contract-content';

export interface ContractCustomization {
  contractTitle: string;
  collateralSummary: string;
  securityClause: string;
  disputeVenue: string;
  witness1Name: string;
  witness1Address: string;
  witness1ValidIdUrl: string;
  witness1ESignatureUrl: string;
  includeSecondWitness: boolean;
  witness2Name: string;
  witness2Address: string;
  witness2ValidIdUrl: string;
  witness2ESignatureUrl: string;
  includeWitnesses: boolean;
  includeBorrowerSignature: boolean;
  lenderSignaturesIncluded: Record<string, boolean>;
  borrowerDateSigned: string;
  lenderDateSigned: Record<string, string>;
  witness1DateSigned: string;
  witness2DateSigned: string;
  additionalTerms: string;
}

export const CONTRACT_CUSTOMIZATION_FIELDS: Array<keyof ContractCustomization> = [
  'contractTitle',
  'collateralSummary',
  'securityClause',
  'disputeVenue',
  'witness1Name',
  'witness1Address',
  'witness1ValidIdUrl',
  'witness1ESignatureUrl',
  'includeSecondWitness',
  'witness2Name',
  'witness2Address',
  'witness2ValidIdUrl',
  'witness2ESignatureUrl',
  'includeWitnesses',
  'includeBorrowerSignature',
  'lenderSignaturesIncluded',
  'borrowerDateSigned',
  'lenderDateSigned',
  'witness1DateSigned',
  'witness2DateSigned',
  'additionalTerms',
];

export function buildDefaultContractCustomization(
  draft: LoanContractDraftInput,
): ContractCustomization {
  const data = buildLoanContractDataFromDraft(draft);
  const signatureDates = buildDefaultSignatureDates(data);

  return {
    contractTitle: data.contractTitle,
    collateralSummary: data.collateralDescription,
    securityClause: getSecurityAndCollateralClause(data),
    disputeVenue: CONTRACT_DISPUTE_VENUE,
    witness1Name: '',
    witness1Address: '',
    witness1ValidIdUrl: '',
    witness1ESignatureUrl: '',
    includeSecondWitness: false,
    witness2Name: '',
    witness2Address: '',
    witness2ValidIdUrl: '',
    witness2ESignatureUrl: '',
    includeWitnesses: true,
    includeBorrowerSignature: true,
    lenderSignaturesIncluded: buildDefaultLenderSignaturesIncluded(
      data.lenders.map((lender) => lender.email),
    ),
    borrowerDateSigned: signatureDates.borrowerDateSigned,
    lenderDateSigned: signatureDates.lenderDateSigned,
    witness1DateSigned: signatureDates.witness1DateSigned,
    witness2DateSigned: signatureDates.witness2DateSigned,
    additionalTerms: '',
  };
}

export function buildDefaultContractCustomizationFromLoan(
  data: LoanContractData,
): ContractCustomization {
  const signatureDates = buildDefaultSignatureDates(data);

  return {
    contractTitle: data.contractTitle,
    collateralSummary: data.collateralDescription,
    securityClause: getSecurityAndCollateralClause(data),
    disputeVenue: CONTRACT_DISPUTE_VENUE,
    witness1Name: '',
    witness1Address: '',
    witness1ValidIdUrl: '',
    witness1ESignatureUrl: '',
    includeSecondWitness: false,
    witness2Name: '',
    witness2Address: '',
    witness2ValidIdUrl: '',
    witness2ESignatureUrl: '',
    includeWitnesses: true,
    includeBorrowerSignature: true,
    lenderSignaturesIncluded: buildDefaultLenderSignaturesIncluded(
      data.lenders.map((lender) => lender.email),
    ),
    borrowerDateSigned: signatureDates.borrowerDateSigned,
    lenderDateSigned: signatureDates.lenderDateSigned,
    witness1DateSigned: signatureDates.witness1DateSigned,
    witness2DateSigned: signatureDates.witness2DateSigned,
    additionalTerms: '',
  };
}

export function applyContractCustomization(
  data: LoanContractData,
  customization: ContractCustomization,
): LoanContractData {
  return {
    ...data,
    contractTitle: customization.contractTitle.trim() || data.contractTitle,
    collateralDescription:
      customization.collateralSummary.trim() || data.collateralDescription,
  };
}

export function mergeCustomizationWithDefaults(
  previous: ContractCustomization,
  defaults: ContractCustomization,
  dirtyFields: Set<keyof ContractCustomization>,
): ContractCustomization {
  return {
    contractTitle: dirtyFields.has('contractTitle')
      ? previous.contractTitle
      : defaults.contractTitle,
    collateralSummary: dirtyFields.has('collateralSummary')
      ? previous.collateralSummary
      : defaults.collateralSummary,
    securityClause: dirtyFields.has('securityClause')
      ? previous.securityClause
      : defaults.securityClause,
    disputeVenue: dirtyFields.has('disputeVenue')
      ? previous.disputeVenue
      : defaults.disputeVenue,
    witness1Name: dirtyFields.has('witness1Name')
      ? previous.witness1Name
      : defaults.witness1Name,
    witness1Address: dirtyFields.has('witness1Address')
      ? previous.witness1Address
      : defaults.witness1Address,
    witness1ValidIdUrl: dirtyFields.has('witness1ValidIdUrl')
      ? previous.witness1ValidIdUrl
      : defaults.witness1ValidIdUrl,
    witness1ESignatureUrl: dirtyFields.has('witness1ESignatureUrl')
      ? previous.witness1ESignatureUrl
      : defaults.witness1ESignatureUrl,
    includeSecondWitness: dirtyFields.has('includeSecondWitness')
      ? previous.includeSecondWitness
      : defaults.includeSecondWitness,
    witness2Name: dirtyFields.has('witness2Name')
      ? previous.witness2Name
      : defaults.witness2Name,
    witness2Address: dirtyFields.has('witness2Address')
      ? previous.witness2Address
      : defaults.witness2Address,
    witness2ValidIdUrl: dirtyFields.has('witness2ValidIdUrl')
      ? previous.witness2ValidIdUrl
      : defaults.witness2ValidIdUrl,
    witness2ESignatureUrl: dirtyFields.has('witness2ESignatureUrl')
      ? previous.witness2ESignatureUrl
      : defaults.witness2ESignatureUrl,
    includeWitnesses: dirtyFields.has('includeWitnesses')
      ? previous.includeWitnesses
      : defaults.includeWitnesses,
    includeBorrowerSignature: dirtyFields.has('includeBorrowerSignature')
      ? previous.includeBorrowerSignature
      : defaults.includeBorrowerSignature,
    lenderSignaturesIncluded: dirtyFields.has('lenderSignaturesIncluded')
      ? mergeLenderBooleanMap(
          previous.lenderSignaturesIncluded,
          defaults.lenderSignaturesIncluded,
        )
      : defaults.lenderSignaturesIncluded,
    borrowerDateSigned: dirtyFields.has('borrowerDateSigned')
      ? previous.borrowerDateSigned
      : defaults.borrowerDateSigned,
    lenderDateSigned: dirtyFields.has('lenderDateSigned')
      ? mergeLenderSignatureDates(
          previous.lenderDateSigned,
          defaults.lenderDateSigned,
        )
      : defaults.lenderDateSigned,
    witness1DateSigned: dirtyFields.has('witness1DateSigned')
      ? previous.witness1DateSigned
      : defaults.witness1DateSigned,
    witness2DateSigned: dirtyFields.has('witness2DateSigned')
      ? previous.witness2DateSigned
      : defaults.witness2DateSigned,
    additionalTerms: dirtyFields.has('additionalTerms')
      ? previous.additionalTerms
      : defaults.additionalTerms,
  };
}

export function createEmptyDirtyFields(): Set<keyof ContractCustomization> {
  return new Set();
}

function mergeLenderSignatureDates(
  previous: Record<string, string>,
  defaults: Record<string, string>,
): Record<string, string> {
  const merged = { ...defaults };

  for (const [email, date] of Object.entries(previous)) {
    if (email in merged) {
      merged[email] = date;
    }
  }

  return merged;
}

function mergeLenderBooleanMap(
  previous: Record<string, boolean>,
  defaults: Record<string, boolean>,
): Record<string, boolean> {
  const merged = { ...defaults };

  for (const [email, included] of Object.entries(previous)) {
    if (email in merged) {
      merged[email] = included;
    }
  }

  return merged;
}

export function buildDefaultLenderSignaturesIncluded(
  lenderEmails: string[],
): Record<string, boolean> {
  return Object.fromEntries(lenderEmails.map((email) => [email, true]));
}

export function isBorrowerSignatureIncluded(
  customization?: ContractCustomization,
): boolean {
  return customization?.includeBorrowerSignature !== false;
}

export function isLenderSignatureIncluded(
  customization: ContractCustomization | undefined,
  lenderEmail: string,
): boolean {
  if (!customization?.lenderSignaturesIncluded) {
    return true;
  }
  return customization.lenderSignaturesIncluded[lenderEmail] !== false;
}
