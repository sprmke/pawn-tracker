'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  buildLoanContractDataFromDraft,
  type LoanContractDraftInput,
} from '@/lib/loan-contract-data';
import {
  buildDefaultContractCustomization,
  CONTRACT_CUSTOMIZATION_FIELDS,
  createEmptyDirtyFields,
  mergeCustomizationWithDefaults,
  parseStoredContractCustomization,
  type ContractCustomization,
} from '@/lib/loan-contract-customization';
import type { Borrower, Investor } from '@/lib/types';
import { LoanContractCustomizationForm } from './loan-contract-customization-form';
import { LoanContractDocumentBody } from './loan-contract-document-body';

interface LoanContractPreviewProps {
  draft: LoanContractDraftInput;
  customization?: ContractCustomization | null;
  onCustomizationChange?: (customization: ContractCustomization) => void;
  borrowers?: Borrower[];
  investors?: Investor[];
  onOpen?: () => void;
  preserveCustomization?: boolean;
}

export function LoanContractPreview({
  draft,
  customization: externalCustomization,
  onCustomizationChange,
  borrowers = [],
  investors = [],
  onOpen,
  preserveCustomization = false,
}: LoanContractPreviewProps) {
  const defaults = useMemo(
    () => buildDefaultContractCustomization(draft),
    [draft],
  );
  const dirtyFieldsRef = useRef(
    preserveCustomization
      ? new Set(CONTRACT_CUSTOMIZATION_FIELDS)
      : createEmptyDirtyFields(),
  );
  const [internalCustomization, setInternalCustomization] =
    useState(defaults);

  const customization = useMemo(
    () =>
      externalCustomization
        ? parseStoredContractCustomization(externalCustomization, defaults)
        : internalCustomization,
    [defaults, externalCustomization, internalCustomization],
  );

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

  const handleFieldsChange = useCallback(
    (changes: Partial<ContractCustomization>) => {
      for (const field of Object.keys(changes) as Array<
        keyof ContractCustomization
      >) {
        dirtyFieldsRef.current.add(field);
      }
      setCustomization({
        ...customization,
        ...changes,
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
      <Collapsible onOpenChange={(open) => open && onOpen?.()}>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-start gap-3 text-left">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">
                Contract Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize contract clauses below, then review the live preview.
                Defaults update from loan details unless you override a field.
              </p>
              {!draft.loanId ? (
                <p className="text-xs text-amber-600">
                  The final contract number will be assigned after the loan is
                  saved.
                </p>
              ) : null}
            </div>
            <ChevronDown className="ml-auto mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <LoanContractCustomizationForm
              value={customization}
              borrowerName={contractData.borrowerName}
              borrowerHasSignature={Boolean(
                contractData.borrowerESignatureUrl,
              )}
              lenders={contractData.lenders}
              borrowers={borrowers}
              investors={investors}
              onChange={handleFieldChange}
              onChanges={handleFieldsChange}
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export type { ContractCustomization };
