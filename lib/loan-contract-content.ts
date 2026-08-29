import type { LoanContractData } from "./loan-contract-data";
import { coerceToDate, formatContractDate } from "./loan-contract-data";
import { calculateLoanDuration } from "./calculations";
import type { ContractCustomization } from "./loan-contract-customization";
import {
  isBorrowerSignatureIncluded,
  isLenderSignatureIncluded,
} from "./loan-contract-customization";
import type { LoanType } from "./types";

export const CONTRACT_DISPUTE_VENUE =
  process.env.NEXT_PUBLIC_CONTRACT_DISPUTE_VENUE ?? "Pampanga, Philippines";

export function getContractTitle(loanType: LoanType): string {
  switch (loanType) {
    case "Agent":
      return "Loan Agreement";
    case "Lot Title":
      return "Loan Agreement with Security";
    case "OR/CR":
      return "Promissory Note and Security Agreement";
    default:
      return "Loan Agreement";
  }
}

export function getCollateralSummary(
  loanType: LoanType,
  loanTitleLabel: string,
  freeLotSqm: number | null,
): string {
  const label =
    loanTitleLabel.trim() || "as described in the Loan Title / Label";

  switch (loanType) {
    case "Agent":
      return "None";
    case "Lot Title": {
      const lotRef =
        freeLotSqm != null && freeLotSqm > 0
          ? `${label} (${freeLotSqm} sqm free lot area)`
          : label;
      return `Lot property (${lotRef}) — documentary security; see Security & Collateral clause`;
    }
    case "OR/CR":
      return `Motor vehicle (${label}) with official OR/CR — documentary security; see Security & Collateral clause`;
    default:
      return "None";
  }
}

export function getSecurityAndCollateralClause(data: LoanContractData): string {
  const label = data.loanTitleLabel.trim() || "the subject property or asset";

  if (data.loanType === "Agent") {
    return "This is an Agent loan. No physical collateral or security documents are pledged under this Agreement. Upon an Event of Default, the Lender(s) may pursue collection and other remedies available under applicable Philippine law.";
  }

  if (data.loanType === "Lot Title") {
    const lotRef =
      data.freeLotSqm != null && data.freeLotSqm > 0
        ? `${label} (including approximately ${data.freeLotSqm} sqm free lot area, if applicable)`
        : label;

    return [
      `The Borrower acknowledges that this loan relates to immovable property identified as: ${lotRef}.`,
      "As documentary security for the Borrower's obligations, the Borrower has delivered, or undertakes to deliver upon request, to the Lender(s) the Certified True Copy (CTC) of the Transfer Certificate of Title (TCT) / Original Certificate of Title (OCT) and such other documents as the Lender(s) may reasonably require.",
      "The parties expressly acknowledge that: (a) possession or custody of a CTC of title does not, by itself, transfer ownership or create a registered real mortgage or other encumbrance; (b) no automatic transfer of ownership to the Lender(s) shall occur upon default, as such automatic transfer (pactum commissorium) is prohibited under Philippine law; and (c) if the parties intend to create a registered security interest over real property, they must execute the proper legal instrument (such as a real estate mortgage or other applicable security document) and comply with registration and other formalities required by law.",
      "Upon an Event of Default, the Lender(s) may pursue collection and enforcement solely through remedies available under applicable Philippine law, including extrajudicial or judicial foreclosure, civil action, or execution, as may be appropriate and as may be set forth in separate instruments or orders of competent authority.",
    ].join(" ");
  }

  return [
    `The Borrower acknowledges that this loan relates to movable property (motor vehicle) identified as: ${label}.`,
    "As documentary security, the Borrower has delivered, or undertakes to deliver upon request, to the Lender(s) the official Certificate of Registration (OR) and Official Receipt (CR), and such other documents as the Lender(s) may reasonably require.",
    "The parties expressly acknowledge that custody of the OR/CR does not, by itself, transfer ownership of the vehicle. No automatic transfer of ownership to the Lender(s) shall occur upon default (pactum commissorium is prohibited).",
    "Upon an Event of Default, the Lender(s) may pursue collection and enforcement of security rights through remedies available under applicable Philippine law, including replevin, collection suit, or other proper legal proceedings.",
  ].join(" ");
}

export function getLoanInterestPeriodLabel(data: LoanContractData): string {
  return calculateLoanDuration(data.dueDate, data.dateBorrowed);
}

export function getContinuingInterestClause(data: LoanContractData): string {
  const periodLabel = getLoanInterestPeriodLabel(data);
  const periodPhrase =
    periodLabel && periodLabel !== "0 Days"
      ? `each successive ${periodLabel} period (being the same interval from Date Borrowed to Expected Payment Date)`
      : "each successive period of the same duration as the original loan term (from Date Borrowed to Expected Payment Date)";

  return [
    "Continuing Interest.",
    "Interest for the initial loan term is computed as stated in the Lender Allocation section above.",
    `If the Total Amount Due is not paid in full on or before the Expected Payment Date, the unpaid balance shall continue to accrue interest at the same rate(s) and on the same basis set forth in the Lender Allocation, for ${periodPhrase}, until the loan is fully satisfied.`,
    "Each additional overdue period shall bear the same interest rate or fixed amount as the initial period (for example, if the loan bears 5% interest for a one-week term, each additional week of delay shall accrue another 5% on the outstanding principal in the same manner).",
    "No separate late payment penalty shall apply beyond the agreed interest.",
  ].join(" ");
}

export function getEventsOfDefaultClause(): string {
  return [
    'Each of the following shall constitute an "Event of Default":',
    "(a) failure to pay the Total Amount Due, or any portion thereof, on or before the Expected Payment Date;",
    "(b) any material misrepresentation or false information provided by the Borrower in connection with this loan;",
    "(c) unauthorized sale, transfer, encumbrance, or disposal of the collateral or security documents, where applicable;",
    "(d) refusal to surrender collateral or security documents when lawfully demanded, where applicable;",
    "(e) insolvency, bankruptcy, or commencement of insolvency proceedings by or against the Borrower; or",
    "(f) any other breach of this Agreement that remains uncured for seven (7) calendar days after written notice from the Lender(s).",
  ].join(" ");
}

export interface ContractTermClause {
  text: string;
}

export function getContractTermClauses(
  data: LoanContractData,
  customization?: ContractCustomization,
): ContractTermClause[] {
  const securityClause =
    customization?.securityClause?.trim() ||
    getSecurityAndCollateralClause(data);
  const disputeVenue =
    customization?.disputeVenue?.trim() || CONTRACT_DISPUTE_VENUE;

  const clauses: ContractTermClause[] = [
    {
      text: `Loan and Acknowledgment of Receipt. The Lender(s) agree to lend, and the Borrower agrees to borrow, the Principal Amount on the Date Borrowed stated above. The Borrower acknowledges having received the Principal Amount from the Lender(s) in full (or in the agreed installments) upon execution of this Agreement, the receipt of which is hereby acknowledged.`,
    },
    {
      text: `Repayment. The Borrower shall repay the Total Amount Due on or before the Expected Payment Date. Interest for the initial loan term (${getLoanInterestPeriodLabel(data)}) is computed as stated in the Lender Allocation section above.`,
    },
    {
      text: securityClause,
    },
    {
      text: getEventsOfDefaultClause(),
    },
    {
      text: `Remedies Upon Default. Upon the occurrence of an Event of Default, the Lender(s) may declare the entire unpaid balance immediately due and payable and pursue all remedies available under this Agreement and applicable Philippine law, without prejudice to separate security instruments, if any.`,
    },
    {
      text: getContinuingInterestClause(data),
    },
    {
      text: `Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Republic of the Philippines.`,
    },
    {
      text: `Dispute Resolution; Venue. Any dispute, controversy, or claim arising out of or relating to this Agreement shall be brought before the proper courts of ${disputeVenue}, to the exclusion of other venues, unless otherwise required by mandatory law.`,
    },
    {
      text: `Notices. Any notice required under this Agreement shall be in writing and deemed duly given when delivered personally, sent by registered mail, or sent to the email address (with confirmation of sending) listed in the signature blocks below, or to such other address as a party may designate in writing.`,
    },
    {
      text: `Entire Agreement. This Agreement, together with any schedules and security documents separately executed, constitutes the entire agreement between the parties with respect to the loan described herein and supersedes all prior understandings, whether oral or written.`,
    },
    {
      text: `Severability. If any provision of this Agreement is held invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.`,
    },
    {
      text: `Electronic Signatures. The parties agree that signatures affixed electronically to this Agreement or to a PDF copy thereof shall be recognized as original signatures for purposes of this transaction, subject to the Electronic Commerce Act (Republic Act No. 8792) and other applicable Philippine law, where permitted.`,
    },
  ];

  if (data.notes?.trim()) {
    clauses.push({
      text: `Additional Notes: ${data.notes.trim()}`,
    });
  }

  if (customization?.additionalTerms?.trim()) {
    clauses.push({
      text: customization.additionalTerms.trim(),
    });
  }

  return clauses;
}

export function getContractIntroText(
  data: LoanContractData,
  customization?: ContractCustomization,
): string {
  const title =
    customization?.contractTitle?.trim() || getContractTitle(data.loanType);
  return `This ${title} ("Agreement") is made and entered into on ${formatIntroDate(data.agreementDate)} at the Republic of the Philippines, by and between the parties whose names and particulars appear below.`;
}

function formatIntroDate(date: Date | string): string {
  return formatContractDate(date);
}

export interface SignaturePartyDetails {
  role: string;
  printedName: string;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  validIdUrl?: string | null;
  eSignatureUrl?: string | null;
  dateSigned?: string | null;
}

export function dateToIsoDateString(date: Date | string): string {
  const parsed = coerceToDate(date);
  if (!parsed) {
    return new Date().toISOString().slice(0, 10);
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatSignatureDateLabel(
  isoDate: string | undefined | null,
  fallbackDate?: Date | string,
): string {
  if (isoDate === "") {
    return "_________________";
  }

  const iso = isoDate?.trim();
  if (iso) {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return formatIntroDate(date);
    }
  }

  if (fallbackDate) {
    const coerced = coerceToDate(fallbackDate, null);
    if (coerced) {
      return formatIntroDate(coerced);
    }
  }

  return "_________________";
}

export function buildDefaultSignatureDates(data: LoanContractData): {
  borrowerDateSigned: string;
  lenderDateSigned: Record<string, string>;
  witness1DateSigned: string;
  witness2DateSigned: string;
} {
  const iso = dateToIsoDateString(data.agreementDate);

  return {
    borrowerDateSigned: iso,
    lenderDateSigned: Object.fromEntries(
      data.lenders.map((lender) => [lender.email, iso]),
    ),
    witness1DateSigned: iso,
    witness2DateSigned: iso,
  };
}

function resolvePartyDateSigned(
  isoDate: string | undefined,
  fallbackDate: Date | string,
): string {
  return formatSignatureDateLabel(isoDate, fallbackDate);
}

export function getBorrowerSignatureDetails(
  data: LoanContractData,
  customization?: ContractCustomization,
): SignaturePartyDetails {
  return {
    role: "Borrower",
    printedName: data.borrowerName,
    address: data.borrowerAddress,
    contact: data.borrowerContact,
    email: data.borrowerEmail,
    validIdUrl: data.borrowerValidIdUrl,
    eSignatureUrl: data.borrowerESignatureUrl,
    dateSigned: resolvePartyDateSigned(
      customization?.borrowerDateSigned,
      data.agreementDate,
    ),
  };
}

export function getLenderSignatureDetails(
  data: LoanContractData,
  customization?: ContractCustomization,
): SignaturePartyDetails[] {
  const multipleLenders = data.lenders.length > 1;

  return data.lenders.map((lender, index) => ({
    role: multipleLenders ? `Lender ${index + 1}` : 'Lender',
    printedName: lender.name,
    address: lender.address,
    contact: lender.contactNumber,
    email: lender.email,
    validIdUrl: lender.validIdUrl,
    eSignatureUrl: lender.eSignatureUrl,
    dateSigned: resolvePartyDateSigned(
      customization?.lenderDateSigned?.[lender.email],
      data.agreementDate,
    ),
  }));
}

export function getWitnessSignatureDetails(
  customization?: ContractCustomization,
  agreementDate: Date | string = new Date(),
): SignaturePartyDetails[] {
  if (customization && !customization.includeWitnesses) {
    return [];
  }

  const blank = "_________________________";
  const witnesses: SignaturePartyDetails[] = [
    {
      role: "Witness 1",
      printedName: customization?.witness1Name?.trim() || blank,
      address: customization?.witness1Address?.trim() || null,
      validIdUrl: customization?.witness1ValidIdUrl?.trim() || null,
      eSignatureUrl: customization?.witness1ESignatureUrl?.trim() || null,
      dateSigned: resolvePartyDateSigned(
        customization?.witness1DateSigned,
        agreementDate,
      ),
    },
  ];

  const includeSecond =
    customization?.includeSecondWitness ||
    Boolean(
      customization?.witness2Name?.trim() ||
      customization?.witness2Address?.trim() ||
      customization?.witness2ValidIdUrl?.trim() ||
      customization?.witness2ESignatureUrl?.trim(),
    );

  if (includeSecond) {
    witnesses.push({
      role: "Witness 2",
      printedName: customization?.witness2Name?.trim() || blank,
      address: customization?.witness2Address?.trim() || null,
      validIdUrl: customization?.witness2ValidIdUrl?.trim() || null,
      eSignatureUrl: customization?.witness2ESignatureUrl?.trim() || null,
      dateSigned: resolvePartyDateSigned(
        customization?.witness2DateSigned,
        agreementDate,
      ),
    });
  }

  return witnesses;
}

export function getContractSignatureParties(
  data: LoanContractData,
  customization?: ContractCustomization,
): SignaturePartyDetails[] {
  return [
    getBorrowerSignatureDetails(data, customization),
    ...getLenderSignatureDetails(data, customization),
    ...getWitnessSignatureDetails(customization, data.agreementDate),
  ];
}

export function shouldShowPartySignatureImage(
  customization: ContractCustomization | undefined,
  party: SignaturePartyDetails,
): boolean {
  if (party.role === 'Borrower') {
    return isBorrowerSignatureIncluded(customization);
  }

  if (
    (party.role === 'Lender' || party.role.startsWith('Lender ')) &&
    party.email
  ) {
    return isLenderSignatureIncluded(customization, party.email);
  }

  if (party.role === 'Witness 1') {
    return customization?.witness1SignatureIncluded !== false;
  }

  if (party.role === 'Witness 2') {
    return customization?.witness2SignatureIncluded !== false;
  }

  return true;
}

export function getContractSignaturePartiesForDisplay(
  data: LoanContractData,
  customization?: ContractCustomization,
  options?: {
    shouldRevealSignature?: (party: SignaturePartyDetails) => boolean;
  },
): SignaturePartyDetails[] {
  return getContractSignatureParties(data, customization).map((party) => {
    if (options?.shouldRevealSignature?.(party)) {
      return party;
    }

    if (!shouldShowPartySignatureImage(customization, party)) {
      return { ...party, eSignatureUrl: null };
    }

    return party;
  });
}

export function getWitnessAttestationText(
  customization?: ContractCustomization,
): string {
  if (customization && !customization.includeWitnesses) {
    return "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.";
  }

  const witnessCount = getWitnessSignatureDetails(customization).length;
  if (witnessCount <= 1) {
    return "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above, in the presence of the undersigned witness.";
  }

  return "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above, in the presence of the undersigned witnesses.";
}

export function shouldShowValidId(party: SignaturePartyDetails): boolean {
  return (
    party.role === 'Borrower' ||
    party.role === 'Lender' ||
    party.role.startsWith('Lender ') ||
    party.role === 'Witness 1' ||
    party.role === 'Witness 2'
  );
}
