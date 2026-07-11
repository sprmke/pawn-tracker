import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { loans } from '@/db/schema';
import { ensureLoanSigningSetup } from '@/lib/loan-contract-persistence';
import {
  isSigningInvitationIncluded,
  resolveContractCustomization,
  resolveSigningPartyDisplayName,
  sortSigningInvitations,
  toSigningInvitationSummary,
} from '@/lib/loan-signing';
import {
  buildDefaultContractCustomizationFromLoan,
  type ContractCustomization,
} from '@/lib/loan-contract-customization';
import { buildLoanContractData } from '@/lib/loan-contract-data';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = Number(id);
    if (Number.isNaN(loanId)) {
      return NextResponse.json({ error: 'Invalid loan ID' }, { status: 400 });
    }

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        borrower: true,
        loanContract: true,
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
            receivedPayments: true,
          },
        },
      },
    });

    if (!loan || loan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const invitations = await ensureLoanSigningSetup(loan);
    const contractData = buildLoanContractData(loan);
    const defaults = buildDefaultContractCustomizationFromLoan(contractData);
    const storedCustomization = loan.loanContract?.customization as
      | ContractCustomization
      | undefined;
    const resolved = resolveContractCustomization(loan, storedCustomization);
    const customization: ContractCustomization = {
      ...defaults,
      ...resolved,
      lenderSignaturesIncluded: {
        ...defaults.lenderSignaturesIncluded,
        ...(resolved.lenderSignaturesIncluded ?? {}),
      },
      lenderDateSigned: {
        ...defaults.lenderDateSigned,
        ...resolved.lenderDateSigned,
      },
    };
    const activeInvitations = invitations.filter((invitation) =>
      isSigningInvitationIncluded(invitation, loan, customization),
    );
    const origin = process.env.NEXT_PUBLIC_APP_URL;
    const summaries = sortSigningInvitations(activeInvitations).map((invitation) =>
      toSigningInvitationSummary(
        {
          id: invitation.id,
          token: invitation.token,
          partyRole: invitation.partyRole,
          investorId: invitation.investorId,
          partyName: resolveSigningPartyDisplayName(
            invitation.partyRole,
            invitation.partyName,
            customization,
          ),
          partyEmail: invitation.partyEmail,
          signatureDataUrl: invitation.signatureDataUrl,
          signedAt: invitation.signedAt,
          consentedAt: invitation.consentedAt,
          expiresAt: invitation.expiresAt,
        },
        origin,
      ),
    );

    return NextResponse.json({
      hasContract: Boolean(loan.loanContract),
      invitations: summaries,
    });
  } catch (error) {
    console.error('Error fetching signing invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signing invitations' },
      { status: 500 },
    );
  }
}
