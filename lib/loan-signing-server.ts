import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { loanSigningInvitations } from '@/db/schema';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import { applyContractCustomization } from '@/lib/loan-contract-customization';
import { buildLoanContractData } from '@/lib/loan-contract-data';
import {
  applySigningSignatures,
  buildInvestorEmailMap,
  resolveContractCustomization,
  resolveSigningPartyDisplayName,
  type SigningInvitationRecord,
} from '@/lib/loan-signing';

export async function loadSigningInvitationByToken(token: string) {
  return db.query.loanSigningInvitations.findFirst({
    where: eq(loanSigningInvitations.token, token),
    with: {
      loan: {
        with: {
          borrower: true,
          loanInvestors: {
            with: {
              investor: true,
              interestPeriods: true,
              receivedPayments: true,
            },
          },
        },
      },
      contract: true,
    },
  });
}

export async function buildSigningPagePayload(
  invitation: NonNullable<Awaited<ReturnType<typeof loadSigningInvitationByToken>>>,
) {
  const loan = invitation.loan;
  const allInvitations = await db.query.loanSigningInvitations.findMany({
    where: eq(loanSigningInvitations.loanId, loan.id),
  });

  const storedCustomization =
    invitation.contract.customization as ContractCustomization;
  const customization = resolveContractCustomization(
    loan,
    storedCustomization,
  );
  const baseData = buildLoanContractData(loan);
  const appliedData = applyContractCustomization(baseData, customization);
  const investorEmailById = buildInvestorEmailMap(loan);

  const merged = applySigningSignatures(
    appliedData,
    customization,
    allInvitations as SigningInvitationRecord[],
    investorEmailById,
  );

  const expired = new Date(invitation.expiresAt).getTime() < Date.now();

  return {
    partyRole: invitation.partyRole,
    partyName: resolveSigningPartyDisplayName(
      invitation.partyRole,
      invitation.partyName,
      merged.customization,
    ),
    partyEmail: invitation.partyEmail,
    signedAt: invitation.signedAt
      ? new Date(invitation.signedAt).toISOString()
      : null,
    signatureDataUrl: invitation.signatureDataUrl,
    contractData: merged.data,
    customization: merged.customization,
    expired,
  };
}
