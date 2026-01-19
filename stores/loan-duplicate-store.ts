import { create } from 'zustand';
import { LoanWithInvestors, InterestType, InterestPeriodStatus } from '@/lib/types';

export interface DuplicateLoanData {
  type: 'Lot Title' | 'OR/CR' | 'Agent';
  dueDate: string | Date;
  freeLotSqm: number | null;
  notes: string | null;
  loanInvestors: Array<{
    investorId: number;
    amount: string;
    interestRate: string;
    interestType: InterestType;
    sentDate: string | Date;
    isPaid: boolean;
    hasMultipleInterest: boolean;
    interestPeriods?: Array<{
      dueDate: string | Date;
      interestRate: string;
      interestType: InterestType;
      status: InterestPeriodStatus;
    }>;
  }>;
}

interface LoanDuplicateState {
  // Duplicate data to be used when creating a new loan
  duplicateData: DuplicateLoanData | null;
  
  // Modal state for the create loan modal
  isCreateModalOpen: boolean;
  
  // Actions
  setDuplicateData: (data: DuplicateLoanData | null) => void;
  openCreateModal: (data: DuplicateLoanData) => void;
  closeCreateModal: () => void;
  clearDuplicateData: () => void;
}

export const useLoanDuplicateStore = create<LoanDuplicateState>((set) => ({
  duplicateData: null,
  isCreateModalOpen: false,
  
  setDuplicateData: (data) => set({ duplicateData: data }),
  
  openCreateModal: (data) => set({ 
    duplicateData: data, 
    isCreateModalOpen: true 
  }),
  
  closeCreateModal: () => set({ 
    isCreateModalOpen: false,
    // Clear duplicate data after a small delay to allow modal close animation
    duplicateData: null,
  }),
  
  clearDuplicateData: () => set({ duplicateData: null }),
}));

// Helper function to create duplicate data from a loan
export function createDuplicateDataFromLoan(loan: LoanWithInvestors): DuplicateLoanData {
  return {
    type: loan.type,
    dueDate: loan.dueDate,
    freeLotSqm: loan.freeLotSqm,
    notes: loan.notes,
    loanInvestors: loan.loanInvestors.map((li) => ({
      investorId: li.investorId,
      amount: li.amount,
      interestRate: li.interestRate,
      interestType: li.interestType,
      sentDate: li.sentDate,
      isPaid: li.isPaid,
      hasMultipleInterest: li.hasMultipleInterest,
      interestPeriods: li.interestPeriods?.map((ip) => ({
        dueDate: ip.dueDate,
        interestRate: ip.interestRate,
        interestType: ip.interestType,
        status: ip.status,
      })),
    })),
  };
}

