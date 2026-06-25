/** Extract depacto sqm noted in loan notes (e.g. "100 sqm"). */
export function extractDepactoFromNotes(
  notes: string | null | undefined,
): number {
  if (!notes) return 0;

  const match = notes.match(/(\d+(?:\.\d+)?)\s*sqm/i);
  return match ? parseFloat(match[1]) : 0;
}

type LoanWithLot = {
  freeLotSqm?: number | null;
  notes?: string | null;
};

export function computeTotalLot(loans: LoanWithLot[]) {
  const totalLot = loans.reduce((sum, loan) => sum + (loan.freeLotSqm || 0), 0);

  const totalLotWithDepacto = loans.reduce((sum, loan) => {
    const lotValue = loan.freeLotSqm || 0;
    const depactoValue = extractDepactoFromNotes(loan.notes);
    return sum + lotValue + depactoValue;
  }, 0);

  return { totalLot, totalLotWithDepacto };
}

export function buildTotalLotMetric(
  totalLot: number,
  totalLotWithDepacto: number,
) {
  const empty = totalLot === 0 && totalLotWithDepacto === 0;

  return {
    label: 'Total Lot',
    empty,
    value:
      empty
        ? '0 sqm'
        : totalLotWithDepacto > totalLot
          ? `${totalLot.toLocaleString()} + ${(totalLotWithDepacto - totalLot).toLocaleString()}`
          : `${totalLot.toLocaleString()} sqm`,
    subValue:
      totalLotWithDepacto > totalLot
        ? `= ${totalLotWithDepacto.toLocaleString()} sqm`
        : undefined,
  };
}
