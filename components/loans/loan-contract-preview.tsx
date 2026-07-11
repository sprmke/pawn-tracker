'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildLoanContractDataFromDraft,
  type LoanContractDraftInput,
} from '@/lib/loan-contract-data';
import {
  buildDefaultContractCustomization,
  createEmptyDirtyFields,
  mergeCustomizationWithDefaults,
  type ContractCustomization,
} from '@/lib/loan-contract-customization';
import { LoanContractCustomizationForm } from './loan-contract-customization-form';
import { LoanContractDocumentBody } from './loan-contract-document-body';

interface LoanContractPreviewProps {
  draft: LoanContractDraftInput;
  customization?: ContractCustomization | null;
  onCustomizationChange?: (customization: ContractCustomization) => void;
}

export function LoanContractPreview({
  draft,
  customization: externalCustomization,
  onCustomizationChange,
}: LoanContractPreviewProps) {
  const defaults = useMemo(
    () => buildDefaultContractCustomization(draft),
    [draft],
  );
  const dirtyFieldsRef = useRef(createEmptyDirtyFields());
  const [internalCustomization, setInternalCustomization] =
    useState(defaults);

  const customization = externalCustomization ?? internalCustomization;

  useEffect(() => {
    const merged = mergeCustomizationWithDefaults(
      customization,
      defaults,
      dirtyFieldsRef.current,
    );

    if (!externalCustomization) {
      setInternalCustomization(merged);
    }

    onCustomizationChange?.(merged);
  }, [defaults]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCustomization = useCallback(
    (next: ContractCustomization) => {
      if (externalCustomization) {
        onCustomizationChange?.(next);
      } else {
        setInternalCustomization(next);
        onCustomizationChange?.(next);
      }
    },
    [externalCustomization, onCustomizationChange],
  );

  const handleFieldChange = useCallback(
    (
      field: keyof ContractCustomization,
      nextValue: ContractCustomization[keyof ContractCustomization],
    ) => {
      dirtyFieldsRef.current.add(field);
      setCustomization({
        ...customization,
        [field]: nextValue,
      });
    },
    [customization, setCustomization],
  );

  const handleReset = useCallback(() => {
    dirtyFieldsRef.current = createEmptyDirtyFields();
    setCustomization(defaults);
  }, [defaults, setCustomization]);

  const contractData = useMemo(
    () => buildLoanContractDataFromDraft(draft),
    [draft],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl">Contract Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize contract clauses below, then review the live preview.
              Defaults update from loan details unless you override a field.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoanContractCustomizationForm
          value={customization}
          borrowerName={contractData.borrowerName}
          lenders={contractData.lenders}
          onChange={handleFieldChange}
          onReset={handleReset}
        />

        <div className="overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm">
          <div className="max-h-[720px] overflow-y-auto">
            <LoanContractDocumentBody
              data={contractData}
              customization={customization}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { ContractCustomization };
