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
  witness1Id: number | null;
  witness1Name: string;
  witness1Email: string;
  witness1Address: string;
  witness1ValidIdUrl: string;
  witness1ESignatureUrl: string;
  witness1SignatureIncluded: boolean;
  includeSecondWitness: boolean;
  witness2Id: number | null;
  witness2Name: string;
  witness2Email: string;
  witness2Address: string;
  witness2ValidIdUrl: string;
  witness2ESignatureUrl: string;
  witness2SignatureIncluded: boolean;
  includeWitnesses: boolean;
  includeBorrowerSignature: boolean;
  lenderSignaturesIncluded: Record<string, boolean>;
  borrowerDateSigned: string;
  lenderDateSigned: Record<string, string>;
  witness1DateSigned: string;
  witness2DateSigned: string;
  additionalTerms: string;
}

/** User-entered contract fields that should not reset when loan draft defaults change. */
export const USER_PERSISTED_CUSTOMIZATION_FIELDS: ReadonlyArray<
  keyof ContractCustomization
> = [
  'witness1Id',
  'witness1Name',
  'witness1Email',
  'witness1Address',
  'witness1ValidIdUrl',
  'witness1ESignatureUrl',
  'witness1SignatureIncluded',
  'witness1DateSigned',
  'includeSecondWitness',
  'witness2Id',
  'witness2Name',
  'witness2Email',
  'witness2Address',
  'witness2ValidIdUrl',
  'witness2ESignatureUrl',
  'witness2SignatureIncluded',
  'witness2DateSigned',
  'includeWitnesses',
  'includeBorrowerSignature',
  'borrowerDateSigned',
  'additionalTerms',
  'disputeVenue',
];

export const CONTRACT_CUSTOMIZATION_FIELDS: Array<keyof ContractCustomization> = [
  'contractTitle',
  'collateralSummary',
  'securityClause',
  'disputeVenue',
  'witness1Id',
  'witness1Name',
  'witness1Email',
  'witness1Address',
  'witness1ValidIdUrl',
  'witness1ESignatureUrl',
  'witness1SignatureIncluded',
  'includeSecondWitness',
  'witness2Id',
  'witness2Name',
  'witness2Email',
  'witness2Address',
  'witness2ValidIdUrl',
  'witness2ESignatureUrl',
  'witness2SignatureIncluded',
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
    witness1Id: null,
    witness1Name: '',
    witness1Email: '',
    witness1Address: '',
    witness1ValidIdUrl: '',
    witness1ESignatureUrl: '',
    witness1SignatureIncluded: true,
    includeSecondWitness: false,
    witness2Id: null,
    witness2Name: '',
    witness2Email: '',
    witness2Address: '',
    witness2ValidIdUrl: '',
    witness2ESignatureUrl: '',
    witness2SignatureIncluded: true,
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
    witness1Id: null,
    witness1Name: '',
    witness1Email: '',
    witness1Address: '',
    witness1ValidIdUrl: '',
    witness1ESignatureUrl: '',
    witness1SignatureIncluded: true,
    includeSecondWitness: false,
    witness2Id: null,
    witness2Name: '',
    witness2Email: '',
    witness2Address: '',
    witness2ValidIdUrl: '',
    witness2ESignatureUrl: '',
    witness2SignatureIncluded: true,
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

function isUserPersistedField(
  field: keyof ContractCustomization,
): field is (typeof USER_PERSISTED_CUSTOMIZATION_FIELDS)[number] {
  return USER_PERSISTED_CUSTOMIZATION_FIELDS.includes(
    field as (typeof USER_PERSISTED_CUSTOMIZATION_FIELDS)[number],
  );
}

function mergeCustomizationField<K extends keyof ContractCustomization>(
  field: K,
  previous: ContractCustomization,
  defaults: ContractCustomization,
  dirtyFields: Set<keyof ContractCustomization>,
): ContractCustomization[K] {
  if (isUserPersistedField(field)) {
    return previous[field];
  }

  if (field === 'lenderSignaturesIncluded') {
    return (
      dirtyFields.has(field)
        ? mergeLenderBooleanMap(
            previous.lenderSignaturesIncluded,
            defaults.lenderSignaturesIncluded,
          )
        : defaults.lenderSignaturesIncluded
    ) as ContractCustomization[K];
  }

  if (field === 'lenderDateSigned') {
    return (
      dirtyFields.has(field)
        ? mergeLenderSignatureDates(
            previous.lenderDateSigned,
            defaults.lenderDateSigned,
          )
        : defaults.lenderDateSigned
    ) as ContractCustomization[K];
  }

  return (
    dirtyFields.has(field) ? previous[field] : defaults[field]
  ) as ContractCustomization[K];
}

export function mergeCustomizationWithDefaults(
  previous: ContractCustomization,
  defaults: ContractCustomization,
  dirtyFields: Set<keyof ContractCustomization>,
): ContractCustomization {
  return {
    contractTitle: mergeCustomizationField(
      'contractTitle',
      previous,
      defaults,
      dirtyFields,
    ),
    collateralSummary: mergeCustomizationField(
      'collateralSummary',
      previous,
      defaults,
      dirtyFields,
    ),
    securityClause: mergeCustomizationField(
      'securityClause',
      previous,
      defaults,
      dirtyFields,
    ),
    disputeVenue: mergeCustomizationField(
      'disputeVenue',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1Id: mergeCustomizationField(
      'witness1Id',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1Name: mergeCustomizationField(
      'witness1Name',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1Email: mergeCustomizationField(
      'witness1Email',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1Address: mergeCustomizationField(
      'witness1Address',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1ValidIdUrl: mergeCustomizationField(
      'witness1ValidIdUrl',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1ESignatureUrl: mergeCustomizationField(
      'witness1ESignatureUrl',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1SignatureIncluded: mergeCustomizationField(
      'witness1SignatureIncluded',
      previous,
      defaults,
      dirtyFields,
    ),
    includeSecondWitness: mergeCustomizationField(
      'includeSecondWitness',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2Id: mergeCustomizationField(
      'witness2Id',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2Name: mergeCustomizationField(
      'witness2Name',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2Email: mergeCustomizationField(
      'witness2Email',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2Address: mergeCustomizationField(
      'witness2Address',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2ValidIdUrl: mergeCustomizationField(
      'witness2ValidIdUrl',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2ESignatureUrl: mergeCustomizationField(
      'witness2ESignatureUrl',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2SignatureIncluded: mergeCustomizationField(
      'witness2SignatureIncluded',
      previous,
      defaults,
      dirtyFields,
    ),
    includeWitnesses: mergeCustomizationField(
      'includeWitnesses',
      previous,
      defaults,
      dirtyFields,
    ),
    includeBorrowerSignature: mergeCustomizationField(
      'includeBorrowerSignature',
      previous,
      defaults,
      dirtyFields,
    ),
    lenderSignaturesIncluded: mergeCustomizationField(
      'lenderSignaturesIncluded',
      previous,
      defaults,
      dirtyFields,
    ),
    borrowerDateSigned: mergeCustomizationField(
      'borrowerDateSigned',
      previous,
      defaults,
      dirtyFields,
    ),
    lenderDateSigned: mergeCustomizationField(
      'lenderDateSigned',
      previous,
      defaults,
      dirtyFields,
    ),
    witness1DateSigned: mergeCustomizationField(
      'witness1DateSigned',
      previous,
      defaults,
      dirtyFields,
    ),
    witness2DateSigned: mergeCustomizationField(
      'witness2DateSigned',
      previous,
      defaults,
      dirtyFields,
    ),
    additionalTerms: mergeCustomizationField(
      'additionalTerms',
      previous,
      defaults,
      dirtyFields,
    ),
  };
}

export function parseStoredContractCustomization(
  stored: unknown,
  defaults: ContractCustomization,
): ContractCustomization {
  if (!stored || typeof stored !== 'object') {
    return defaults;
  }

  const parsed = stored as Partial<ContractCustomization>;
  return {
    ...defaults,
    ...parsed,
    lenderSignaturesIncluded: {
      ...defaults.lenderSignaturesIncluded,
      ...(parsed.lenderSignaturesIncluded ?? {}),
    },
    lenderDateSigned: {
      ...defaults.lenderDateSigned,
      ...(parsed.lenderDateSigned ?? {}),
    },
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
