import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { loans } from '@/db/schema';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import {
  applyContractCustomization,
  buildDefaultContractCustomizationFromLoan,
} from '@/lib/loan-contract-customization';
import { buildLoanContractData } from '@/lib/loan-contract-data';
import {
  applySigningSignatures,
  buildInvestorEmailMap,
  type SigningInvitationRecord,
} from '@/lib/loan-signing';

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
        signingInvitations: true,
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

    const baseData = buildLoanContractData(loan);
    const storedCustomization = loan.loanContract
      ?.customization as ContractCustomization | undefined;
    const customization =
      storedCustomization ??
      buildDefaultContractCustomizationFromLoan(baseData);
    const appliedData = applyContractCustomization(baseData, customization);
    const investorEmailById = buildInvestorEmailMap(loan);
    const merged = applySigningSignatures(
      appliedData,
      customization,
      (loan.signingInvitations ?? []) as SigningInvitationRecord[],
      investorEmailById,
    );

    return NextResponse.json({
      contractData: merged.data,
      customization: merged.customization,
      hasStoredContract: Boolean(loan.loanContract),
    });
  } catch (error) {
    console.error('Error fetching loan contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan contract' },
      { status: 500 },
    );
  }
}
