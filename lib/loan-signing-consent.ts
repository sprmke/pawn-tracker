import type { SigningPartyRole } from './loan-signing';

export function getSigningPartyRoleLabel(
  role: SigningPartyRole,
  lenderIndex?: number,
): string {
  switch (role) {
    case 'borrower':
      return 'Borrower';
    case 'lender':
      return lenderIndex != null && lenderIndex > 1
        ? `Lender ${lenderIndex}`
        : 'Lender / Investor';
    case 'witness_1':
      return 'Witness 1';
    case 'witness_2':
      return 'Witness 2';
    default:
      return 'Signatory';
  }
}

export function getElectronicSignatureConsentText(
  partyRole: SigningPartyRole,
  displayName?: string,
): {
  heading: string;
  consentDescription: string;
  detailsLinkLabel: string;
  body: string[];
  submitLabel: string;
} {
  const roleLabel = displayName ?? getSigningPartyRoleLabel(partyRole);

  return {
    heading: 'Electronic Signature and Consent',
    consentDescription:
      'I confirm that I have read the contract and agree to all terms and conditions of this Loan Agreement, and I consent to sign electronically under Philippine law.',
    detailsLinkLabel: 'View full consent details',
    body: [
      `You are signing this Loan Agreement as the ${roleLabel}. Before proceeding, please read the full contract above, including all terms, conditions, collateral or security provisions, and signature blocks.`,
      'By clicking "I Agree and Sign Electronically" below, you confirm that: (a) you have read and understood the entire agreement; (b) you voluntarily agree to be legally bound by all of its terms and conditions; (c) the information you provided is true and correct to the best of your knowledge; and (d) you authorize the use of your electronic signature on this document.',
      'Your electronic signature is executed in accordance with Republic Act No. 8792 (Electronic Commerce Act of 2000) and applicable rules of the Supreme Court of the Philippines on electronic evidence and notarization, where relevant. Under Philippine law, an electronic signature that reliably identifies the signatory and shows intent to approve the document may have the same legal effect as a handwritten signature, subject to any formal requirements that may apply to the specific transaction.',
      'You acknowledge that this agreement may be stored and reproduced in electronic form. Once submitted, your signature for this role cannot be changed or overwritten by another person.',
    ],
    submitLabel: 'I Agree and Sign Electronically',
  };
}

export function getSignedConfirmationMessage(
  partyRole: SigningPartyRole,
  displayName?: string,
): string {
  const roleLabel = displayName ?? getSigningPartyRoleLabel(partyRole);
  return `Thank you. Your electronic signature as ${roleLabel} has been recorded. You may close this page. The other parties may sign using their own secure links.`;
}
