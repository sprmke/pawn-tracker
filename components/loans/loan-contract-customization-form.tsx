'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, RotateCcw, UsersRound } from 'lucide-react';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import type { ContractLender } from '@/lib/loan-contract-data';
import type { Borrower, Investor } from '@/lib/types';
import { LoanContractParticipantsEditor } from './loan-contract-participants-editor';

interface LoanContractCustomizationFormProps {
  value: ContractCustomization;
  borrowerName: string;
  borrowerHasSignature: boolean;
  lenders: ContractLender[];
  borrowers: Borrower[];
  investors: Investor[];
  onChange: (
    field: keyof ContractCustomization,
    nextValue: ContractCustomization[keyof ContractCustomization],
  ) => void;
  onChanges: (changes: Partial<ContractCustomization>) => void;
  onReset: () => void;
}

export function LoanContractCustomizationForm({
  value,
  borrowerName,
  borrowerHasSignature,
  lenders,
  borrowers,
  investors,
  onChange,
  onChanges,
  onReset,
}: LoanContractCustomizationFormProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Contract setup</p>
          <p className="text-xs text-muted-foreground">
            Manage parties and signatures first, then refine the legal terms.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Reset defaults
        </Button>
      </div>

      <Tabs defaultValue="participants" className="p-4">
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="participants" className="gap-2 py-2">
            <UsersRound className="h-4 w-4" />
            Parties &amp; signatures
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2 py-2">
            <FileText className="h-4 w-4" />
            Contract terms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="mt-4">
          <LoanContractParticipantsEditor
            value={value}
            borrowerName={borrowerName}
            borrowerHasSignature={borrowerHasSignature}
            lenders={lenders}
            borrowers={borrowers}
            investors={investors}
            onChange={onChange}
            onChanges={onChanges}
          />
        </TabsContent>

        <TabsContent value="terms" className="mt-4">
          <div className="space-y-5 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium">Document and legal terms</p>
              <p className="text-xs text-muted-foreground">
                Loan amounts and dates stay synced with the loan. Only override
                contract wording that needs special handling.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contractTitle">Document title</Label>
                <Input
                  id="contractTitle"
                  value={value.contractTitle}
                  onChange={(event) =>
                    onChange('contractTitle', event.target.value)
                  }
                  placeholder="e.g., Loan Agreement with Security"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="collateralSummary">Collateral summary</Label>
                <p className="text-xs text-muted-foreground">
                  Short description shown in the Loan Terms table.
                </p>
                <Textarea
                  id="collateralSummary"
                  value={value.collateralSummary}
                  onChange={(event) =>
                    onChange('collateralSummary', event.target.value)
                  }
                  rows={3}
                  placeholder="Describe the collateral briefly"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="securityClause">
                  Security &amp; collateral clause
                </Label>
                <p className="text-xs text-muted-foreground">
                  Full legal clause included in the Terms and Conditions.
                </p>
                <Textarea
                  id="securityClause"
                  value={value.securityClause}
                  onChange={(event) =>
                    onChange('securityClause', event.target.value)
                  }
                  rows={10}
                  placeholder="Full security clause"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disputeVenue">Dispute venue</Label>
                <Input
                  id="disputeVenue"
                  value={value.disputeVenue}
                  onChange={(event) =>
                    onChange('disputeVenue', event.target.value)
                  }
                  placeholder="e.g., Pampanga, Philippines"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="additionalTerms">
                  Additional terms (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Appended as a separate clause at the end of the contract.
                </p>
                <Textarea
                  id="additionalTerms"
                  value={value.additionalTerms}
                  onChange={(event) =>
                    onChange('additionalTerms', event.target.value)
                  }
                  rows={4}
                  placeholder="Add a special condition or clause"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
