import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  loanContracts,
  loanSigningInvitations,
} from '@/db/schema';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import { buildDefaultContractCustomizationFromLoan } from '@/lib/loan-contract-customization';
import { buildLoanContractData } from '@/lib/loan-contract-data';
import {
  buildSigningInvitationsForLoan,
  generateSigningToken,
  getSigningExpiryDate,
  getWitnessInvitationPartyName,
} from '@/lib/loan-signing';
import type { SigningPartyRole } from '@/lib/loan-signing';
import type { LoanWithInvestors } from '@/lib/types';

function signingInvitationKey(
  partyRole: SigningPartyRole,
  investorId?: number | null,
): string {
  if (partyRole === 'lender') {
    return `lender:${investorId ?? 'unknown'}`;
  }
  return partyRole;
}

export async function saveLoanContractAndInvitations(
  loan: LoanWithInvestors,
  customizationInput?: ContractCustomization | null,
) {
  const contractData = buildLoanContractData(loan);
  const customization =
    customizationInput ??
    buildDefaultContractCustomizationFromLoan(contractData);

  const [contract] = await db
    .insert(loanContracts)
    .values({
      loanId: loan.id,
      customization,
    })
    .returning();

  const invitations = await insertSigningInvitations(
    loan,
    contract.id,
    customization,
  );

  return { contract, invitations };
}

async function insertSigningInvitations(
  loan: LoanWithInvestors,
  contractId: number,
  customization: ContractCustomization,
) {
  const invitationInputs = buildSigningInvitationsForLoan(
    loan,
    contractId,
    customization,
  );

  if (invitationInputs.length === 0) {
    return [];
  }

  const expiresAt = getSigningExpiryDate();

  return db
    .insert(loanSigningInvitations)
    .values(
      invitationInputs.map((input) => ({
        loanId: input.loanId,
        contractId: input.contractId,
        token: generateSigningToken(),
        partyRole: input.partyRole,
        investorId: input.investorId ?? null,
        witnessId: input.witnessId ?? null,
        partyName: input.partyName,
        partyEmail: input.partyEmail ?? null,
        expiresAt,
      })),
    )
    .returning();
}

async function insertSigningInvitationInputs(
  inputs: ReturnType<typeof buildSigningInvitationsForLoan>,
) {
  if (inputs.length === 0) {
    return [];
  }

  const expiresAt = getSigningExpiryDate();

  return db
    .insert(loanSigningInvitations)
    .values(
      inputs.map((input) => ({
        loanId: input.loanId,
        contractId: input.contractId,
        token: generateSigningToken(),
        partyRole: input.partyRole,
        investorId: input.investorId ?? null,
        witnessId: input.witnessId ?? null,
        partyName: input.partyName,
        partyEmail: input.partyEmail ?? null,
        expiresAt,
      })),
    )
    .returning();
}

async function syncSigningInvitationPartyNames(
  loanId: number,
  customization: ContractCustomization,
) {
  const witnessRoles = ['witness_1', 'witness_2'] as const;

  for (const partyRole of witnessRoles) {
    const isFirst = partyRole === 'witness_1';
    await db
      .update(loanSigningInvitations)
      .set({
        partyName: getWitnessInvitationPartyName(partyRole, customization),
        partyEmail:
          (isFirst
            ? customization.witness1Email
            : customization.witness2Email
          )?.trim() || null,
        witnessId: isFirst
          ? customization.witness1Id
          : customization.witness2Id,
      })
      .where(
        and(
          eq(loanSigningInvitations.loanId, loanId),
          eq(loanSigningInvitations.partyRole, partyRole),
        ),
      );
  }
}

export async function upsertLoanContractCustomization(
  loan: LoanWithInvestors,
  customization: ContractCustomization,
) {
  const existing = await db.query.loanContracts.findFirst({
    where: eq(loanContracts.loanId, loan.id),
  });

  if (existing) {
    const [updated] = await db
      .update(loanContracts)
      .set({
        customization,
        updatedAt: new Date(),
      })
      .where(eq(loanContracts.id, existing.id))
      .returning();
    await syncSigningInvitationPartyNames(loan.id, customization);
    return updated;
  }

  const [created] = await db
    .insert(loanContracts)
    .values({
      loanId: loan.id,
      customization,
    })
    .returning();

  await syncSigningInvitationPartyNames(loan.id, customization);
  return created;
}

export async function syncSigningInvitationsForLoan(loan: LoanWithInvestors) {
  let contract = await db.query.loanContracts.findFirst({
    where: eq(loanContracts.loanId, loan.id),
  });

  if (!contract) {
    const result = await saveLoanContractAndInvitations(loan, null);
    return result.invitations;
  }

  const customization = contract.customization as ContractCustomization;
  const existing = await db.query.loanSigningInvitations.findMany({
    where: eq(loanSigningInvitations.loanId, loan.id),
  });

  const existingKeys = new Set(
    existing.map((invitation) =>
      signingInvitationKey(invitation.partyRole, invitation.investorId),
    ),
  );

  const expected = buildSigningInvitationsForLoan(
    loan,
    contract.id,
    customization,
  );

  const missing = expected.filter(
    (input) =>
      !existingKeys.has(
        signingInvitationKey(input.partyRole, input.investorId ?? null),
      ),
  );

  if (missing.length === 0) {
    await syncSigningInvitationPartyNames(loan.id, customization);
    return existing;
  }

  const inserted = await insertSigningInvitationInputs(missing);
  await syncSigningInvitationPartyNames(loan.id, customization);
  return [...existing, ...inserted];
}

export async function ensureLoanSigningSetup(loan: LoanWithInvestors) {
  return syncSigningInvitationsForLoan(loan);
}
