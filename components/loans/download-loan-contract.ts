'use client';

import { toast } from '@/lib/toast';
import { renderLoanContractPDF } from '@/components/pdf/loan-contract-pdf-document';
import type { LoanWithInvestors } from '@/lib/types';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import type { LoanContractData } from '@/lib/loan-contract-data';

/**
 * Downloads the loan contract PDF, falling back to a contract built from the
 * loan itself when the stored contract cannot be loaded.
 */
export async function downloadLoanContract(
  loan: LoanWithInvestors,
): Promise<void> {
  try {
    const response = await fetch(`/api/loans/${loan.id}/contract`);
    if (response.ok) {
      const payload = (await response.json()) as {
        contractData: LoanContractData;
        customization: ContractCustomization;
      };
      await renderLoanContractPDF(
        loan,
        payload.customization,
        payload.contractData,
      );
    } else {
      await renderLoanContractPDF(loan);
    }
    toast.success('Contract PDF downloaded.');
  } catch (error) {
    console.error('Error generating loan contract PDF:', error);
    toast.error('Failed to generate contract PDF.');
  }
}
