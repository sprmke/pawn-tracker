'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ValidIdUpload } from '@/components/common/valid-id-upload';
import { ESignatureUpload } from '@/components/common/e-signature-upload';
import { DatePicker } from '@/components/ui/date-picker';
import { ChevronDown, RotateCcw } from 'lucide-react';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import type { ContractLender } from '@/lib/loan-contract-data';

interface LoanContractCustomizationFormProps {
  value: ContractCustomization;
  borrowerName: string;
  lenders: ContractLender[];
  onChange: (
    field: keyof ContractCustomization,
    nextValue: ContractCustomization[keyof ContractCustomization],
  ) => void;
  onReset: () => void;
}

interface WitnessFieldsGroupProps {
  title: string;
  idPrefix: string;
  name: string;
  address: string;
  validIdUrl: string;
  eSignatureUrl: string;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onValidIdChange: (value: string | null) => void;
  onESignatureChange: (value: string | null) => void;
}

function WitnessFieldsGroup({
  title,
  idPrefix,
  name,
  address,
  validIdUrl,
  eSignatureUrl,
  onNameChange,
  onAddressChange,
  onValidIdChange,
  onESignatureChange,
}: WitnessFieldsGroupProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Leave blank for signature line only"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Input
          id={`${idPrefix}-address`}
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <ValidIdUpload
        idPrefix={`${idPrefix}-valid-id`}
        value={validIdUrl || null}
        onChange={onValidIdChange}
        label="Valid ID"
        description="Shown on the witness signature block in the contract."
      />

      <ESignatureUpload
        idPrefix={`${idPrefix}-e-signature`}
        value={eSignatureUrl || null}
        onChange={onESignatureChange}
        description="Shown as the witness signature on the contract."
      />
    </div>
  );
}

function SignatureDatesSection({
  borrowerName,
  lenders,
  value,
  onChange,
}: {
  borrowerName: string;
  lenders: ContractLender[];
  value: ContractCustomization;
  onChange: LoanContractCustomizationFormProps['onChange'];
}) {
  const borrowerIncluded = value.includeBorrowerSignature !== false;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Signatures</p>
        <p className="text-xs text-muted-foreground">
          Choose which signatures appear on the contract. When disabled, the
          signature line is shown as unsigned. Signing links are not affected.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <Label htmlFor="borrower-date-signed">Borrower</Label>
            <p className="text-xs text-muted-foreground">
              {borrowerName.trim() || 'Selected borrower'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Checkbox
              id="include-borrower-signature"
              checked={borrowerIncluded}
              onCheckedChange={(checked) =>
                onChange('includeBorrowerSignature', checked === true)
              }
            />
            <Label
              htmlFor="include-borrower-signature"
              className="text-xs font-normal"
            >
              Show signature
            </Label>
          </div>
        </div>
        <DatePicker
          id="borrower-date-signed"
          value={value.borrowerDateSigned}
          onChange={(next) => onChange('borrowerDateSigned', next)}
          placeholder="Select signing date"
        />
      </div>

      {lenders.length > 0 && (
        <div className="space-y-3">
          {lenders.map((lender, index) => {
            const lenderIncluded =
              value.lenderSignaturesIncluded?.[lender.email] !== false;

            return (
              <div
                key={lender.email}
                className="space-y-2 rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label htmlFor={`lender-date-signed-${lender.email}`}>
                      {lenders.length > 1 ? `Lender ${index + 1}` : 'Lender'}
                    </Label>
                    <p className="text-xs text-muted-foreground">{lender.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Checkbox
                      id={`include-lender-signature-${lender.email}`}
                      checked={lenderIncluded}
                      onCheckedChange={(checked) =>
                        onChange('lenderSignaturesIncluded', {
                          ...value.lenderSignaturesIncluded,
                          [lender.email]: checked === true,
                        })
                      }
                    />
                    <Label
                      htmlFor={`include-lender-signature-${lender.email}`}
                      className="text-xs font-normal"
                    >
                      Show signature
                    </Label>
                  </div>
                </div>
                <DatePicker
                  id={`lender-date-signed-${lender.email}`}
                  value={value.lenderDateSigned[lender.email] ?? ''}
                  onChange={(next) =>
                    onChange('lenderDateSigned', {
                      ...value.lenderDateSigned,
                      [lender.email]: next,
                    })
                  }
                  placeholder="Select signing date"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <Label htmlFor="witness1-date-signed">Witness 1</Label>
            <p className="text-xs text-muted-foreground">
              {value.witness1Name.trim() || 'First witness'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Checkbox
              id="include-witness1-signature"
              checked={value.includeWitnesses}
              onCheckedChange={(checked) =>
                onChange('includeWitnesses', checked === true)
              }
            />
            <Label
              htmlFor="include-witness1-signature"
              className="text-xs font-normal"
            >
              Include
            </Label>
          </div>
        </div>
        <DatePicker
          id="witness1-date-signed"
          value={value.witness1DateSigned}
          onChange={(next) => onChange('witness1DateSigned', next)}
          placeholder="Select signing date"
          disabled={!value.includeWitnesses}
        />
      </div>

      {value.includeWitnesses && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="witness2-date-signed">Witness 2</Label>
              <p className="text-xs text-muted-foreground">
                {value.witness2Name.trim() || 'Second witness'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Checkbox
                id="include-witness2-signature"
                checked={value.includeSecondWitness}
                onCheckedChange={(checked) =>
                  onChange('includeSecondWitness', checked === true)
                }
              />
              <Label
                htmlFor="include-witness2-signature"
                className="text-xs font-normal"
              >
                Include
              </Label>
            </div>
          </div>
          <DatePicker
            id="witness2-date-signed"
            value={value.witness2DateSigned}
            onChange={(next) => onChange('witness2DateSigned', next)}
            placeholder="Select signing date"
            disabled={!value.includeSecondWitness}
          />
        </div>
      )}
    </div>
  );
}

export function LoanContractCustomizationForm({
  value,
  borrowerName,
  lenders,
  onChange,
  onReset,
}: LoanContractCustomizationFormProps) {
  return (
    <Collapsible
      defaultOpen
      className="rounded-xl border border-border bg-muted/20"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
          <div>
            <p className="text-sm font-medium">Customize Contract</p>
            <p className="text-xs text-muted-foreground">
              Override auto-generated defaults for collateral, witnesses, and
              other clauses.
            </p>
          </div>
        </CollapsibleTrigger>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Reset defaults
        </Button>
      </div>

      <CollapsibleContent className="space-y-4 border-t border-border px-4 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contractTitle">Document Title</Label>
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
            <Label htmlFor="collateralSummary">
              Collateral / Security (summary row)
            </Label>
            <Textarea
              id="collateralSummary"
              value={value.collateralSummary}
              onChange={(event) =>
                onChange('collateralSummary', event.target.value)
              }
              rows={3}
              placeholder="Short summary shown in the Loan Terms table"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="securityClause">
              Security &amp; Collateral Clause
            </Label>
            <Textarea
              id="securityClause"
              value={value.securityClause}
              onChange={(event) =>
                onChange('securityClause', event.target.value)
              }
              rows={12}
              placeholder="Full security clause in Terms and Conditions"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="disputeVenue">Dispute Venue</Label>
            <Input
              id="disputeVenue"
              value={value.disputeVenue}
              onChange={(event) => onChange('disputeVenue', event.target.value)}
              placeholder="e.g., Pampanga, Philippines"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="additionalTerms">Additional Terms (optional)</Label>
            <Textarea
              id="additionalTerms"
              value={value.additionalTerms}
              onChange={(event) =>
                onChange('additionalTerms', event.target.value)
              }
              rows={3}
              placeholder="Extra clause appended to Terms and Conditions"
            />
          </div>
        </div>

        <SignatureDatesSection
          borrowerName={borrowerName}
          lenders={lenders}
          value={value}
          onChange={onChange}
        />

        <div className="space-y-4 rounded-lg border border-border bg-background p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Witness Details</p>
            <p className="text-xs text-muted-foreground">
              Optional name, address, and ID for witnesses enabled above.
            </p>
          </div>

          {value.includeWitnesses && (
            <div className="space-y-4">
              <WitnessFieldsGroup
                title="Witness 1"
                idPrefix="witness1"
                name={value.witness1Name}
                address={value.witness1Address}
                validIdUrl={value.witness1ValidIdUrl}
                eSignatureUrl={value.witness1ESignatureUrl}
                onNameChange={(next) => onChange('witness1Name', next)}
                onAddressChange={(next) => onChange('witness1Address', next)}
                onValidIdChange={(next) =>
                  onChange('witness1ValidIdUrl', next ?? '')
                }
                onESignatureChange={(next) =>
                  onChange('witness1ESignatureUrl', next ?? '')
                }
              />

              {value.includeSecondWitness && (
                <WitnessFieldsGroup
                  title="Witness 2"
                  idPrefix="witness2"
                  name={value.witness2Name}
                  address={value.witness2Address}
                  validIdUrl={value.witness2ValidIdUrl}
                  eSignatureUrl={value.witness2ESignatureUrl}
                  onNameChange={(next) => onChange('witness2Name', next)}
                  onAddressChange={(next) => onChange('witness2Address', next)}
                  onValidIdChange={(next) =>
                    onChange('witness2ValidIdUrl', next ?? '')
                  }
                  onESignatureChange={(next) =>
                    onChange('witness2ESignatureUrl', next ?? '')
                  }
                />
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
