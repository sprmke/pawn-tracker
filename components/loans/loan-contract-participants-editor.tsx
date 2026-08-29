'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  PenLine,
  Search,
  Save,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ESignatureUpload } from '@/components/common/e-signature-upload';
import { ValidIdUpload } from '@/components/common/valid-id-upload';
import type { ContractCustomization } from '@/lib/loan-contract-customization';
import type { ContractLender } from '@/lib/loan-contract-data';
import { toast } from '@/lib/toast';
import type { Borrower, Investor, Witness } from '@/lib/types';

interface ContractParticipantsEditorProps {
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
}

interface ExistingContact {
  id: number;
  key: string;
  kind: 'Borrower' | 'Investor' | 'Witness';
  name: string;
  email: string | null;
  contactNumber: string | null;
  address: string | null;
  validIdUrl: string | null;
  eSignatureUrl: string | null;
}

function SignatureStatus({ available }: { available: boolean }) {
  return (
    <Badge variant={available ? 'success' : 'outline'}>
      <PenLine className="mr-1 h-3 w-3" />
      {available ? 'Signature ready' : 'No saved signature'}
    </Badge>
  );
}

function ExistingContactPicker({
  contacts,
  onSelect,
}: {
  contacts: ExistingContact[];
  onSelect: (contact: ExistingContact) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredContacts = contacts.filter((contact) => {
    if (!normalizedQuery) return true;
    return [contact.name, contact.email, contact.contactNumber]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery));
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Find an existing contact
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, or phone..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredContacts.length ? (
            filteredContacts.map((contact) => (
              <button
                type="button"
                key={contact.key}
                onClick={() => {
                  onSelect(contact);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {contact.name}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {contact.kind}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {contact.email || contact.contactNumber || 'No contact info'}
                  </p>
                </div>
                {contact.eSignatureUrl ? (
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matching contacts found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function WitnessEditor({
  number,
  value,
  contacts,
  onChanges,
  onWitnessCreated,
}: {
  number: 1 | 2;
  value: ContractCustomization;
  contacts: ExistingContact[];
  onChanges: (changes: Partial<ContractCustomization>) => void;
  onWitnessCreated: (witness: Witness) => void;
}) {
  const prefix = `witness${number}` as const;
  const witnessId = value[`${prefix}Id`];
  const name = value[`${prefix}Name`];
  const email = value[`${prefix}Email`];
  const address = value[`${prefix}Address`];
  const validIdUrl = value[`${prefix}ValidIdUrl`];
  const eSignatureUrl = value[`${prefix}ESignatureUrl`];
  const signatureIncluded = value[`${prefix}SignatureIncluded`] !== false;
  const [isSaving, setIsSaving] = useState(false);

  const selectContact = (contact: ExistingContact) => {
    onChanges({
      [`${prefix}Id`]: contact.kind === 'Witness' ? contact.id : null,
      [`${prefix}Name`]: contact.name,
      [`${prefix}Email`]: contact.email ?? '',
      [`${prefix}Address`]: contact.address ?? '',
      [`${prefix}ValidIdUrl`]: contact.validIdUrl ?? '',
      [`${prefix}ESignatureUrl`]: contact.eSignatureUrl ?? '',
      [`${prefix}SignatureIncluded`]: Boolean(contact.eSignatureUrl),
    });
  };

  const saveAsWitness = async () => {
    if (!name.trim()) {
      toast.error('Enter the witness name before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/witnesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          address,
          validIdUrl,
          eSignatureUrl,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save witness.');
      }

      const witness = result as Witness;
      onWitnessCreated(witness);
      onChanges({ [`${prefix}Id`]: witness.id });
      toast.success(`${witness.name} saved to the witness directory.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save witness.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Witness {number}</p>
          <p className="text-xs text-muted-foreground">
            Select a saved contact or enter someone manually.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {witnessId ? <Badge variant="secondary">Saved witness</Badge> : null}
          <SignatureStatus available={Boolean(eSignatureUrl)} />
        </div>
      </div>

      <ExistingContactPicker contacts={contacts} onSelect={selectContact} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-name`}>Full name</Label>
          <Input
            id={`${prefix}-name`}
            value={name}
            onChange={(event) =>
              onChanges({ [`${prefix}Name`]: event.target.value })
            }
            placeholder="Witness name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-email`}>Email</Label>
          <Input
            id={`${prefix}-email`}
            type="email"
            value={email}
            onChange={(event) =>
              onChanges({ [`${prefix}Email`]: event.target.value })
            }
            placeholder="Used for a signing invitation"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${prefix}-address`}>Address</Label>
          <Input
            id={`${prefix}-address`}
            value={address}
            onChange={(event) =>
              onChanges({ [`${prefix}Address`]: event.target.value })
            }
            placeholder="Optional address"
          />
        </div>
      </div>

      {!witnessId ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={saveAsWitness}
          disabled={isSaving || !name.trim()}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save to witness directory'}
        </Button>
      ) : null}

      <DatePicker
        id={`${prefix}-date-signed`}
        value={value[`${prefix}DateSigned`]}
        onChange={(next) => onChanges({ [`${prefix}DateSigned`]: next })}
        placeholder="Select signing date"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ValidIdUpload
          idPrefix={`${prefix}-valid-id`}
          value={validIdUrl || null}
          onChange={(next) =>
            onChanges({ [`${prefix}ValidIdUrl`]: next ?? '' })
          }
          label="Valid ID"
          description="Optional ID shown in the witness block."
        />
        <ESignatureUpload
          idPrefix={`${prefix}-e-signature`}
          value={eSignatureUrl || null}
          onChange={(next) =>
            onChanges({ [`${prefix}ESignatureUrl`]: next ?? '' })
          }
          description="Choose whether to use, replace, or remove this signature."
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
        <Checkbox
          id={`${prefix}-include-signature`}
          checked={signatureIncluded}
          disabled={!eSignatureUrl}
          onCheckedChange={(checked) =>
            onChanges({
              [`${prefix}SignatureIncluded`]: checked === true,
            })
          }
        />
        <div>
          <Label htmlFor={`${prefix}-include-signature`}>
            Use saved signature image
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This only controls the image printed on the contract. The signing
            invitation remains available.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoanContractParticipantsEditor({
  value,
  borrowerName,
  borrowerHasSignature,
  lenders,
  borrowers,
  investors,
  onChange,
  onChanges,
}: ContractParticipantsEditorProps) {
  const [witnesses, setWitnesses] = useState<Witness[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWitnesses() {
      try {
        const response = await fetch('/api/witnesses');
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setWitnesses(data);
        }
      } catch (error) {
        console.error('Error loading witnesses:', error);
      }
    }

    void loadWitnesses();
    return () => {
      cancelled = true;
    };
  }, []);

  const contacts = useMemo<ExistingContact[]>(
    () => [
      ...witnesses.map((witness) => ({
        id: witness.id,
        key: `witness-${witness.id}`,
        kind: 'Witness' as const,
        name: witness.name,
        email: witness.email,
        contactNumber: witness.contactNumber,
        address: witness.address,
        validIdUrl: witness.validIdUrl,
        eSignatureUrl: witness.eSignatureUrl,
      })),
      ...borrowers.map((borrower) => ({
        id: borrower.id,
        key: `borrower-${borrower.id}`,
        kind: 'Borrower' as const,
        name: borrower.name,
        email: borrower.email,
        contactNumber: borrower.contactNumber,
        address: borrower.address,
        validIdUrl: borrower.validIdUrl,
        eSignatureUrl: borrower.eSignatureUrl,
      })),
      ...investors.map((investor) => ({
        id: investor.id,
        key: `investor-${investor.id}`,
        kind: 'Investor' as const,
        name: investor.name,
        email: investor.email,
        contactNumber: investor.contactNumber,
        address: investor.address,
        validIdUrl: investor.validIdUrl,
        eSignatureUrl: investor.eSignatureUrl,
      })),
    ],
    [borrowers, investors, witnesses],
  );

  const handleWitnessCreated = (witness: Witness) => {
    setWitnesses((current) =>
      [...current.filter((item) => item.id !== witness.id), witness].sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <UsersRound className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Borrower and lenders</p>
            <p className="text-xs text-muted-foreground">
              Legal parties come from the loan details and funding allocations.
              Saved-signature switches only control the printed image; signing
              links remain available.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{borrowerName}</p>
                <Badge variant="secondary">Borrower</Badge>
                <SignatureStatus available={borrowerHasSignature} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-borrower-signature"
                checked={value.includeBorrowerSignature !== false}
                onCheckedChange={(checked) =>
                  onChange('includeBorrowerSignature', checked === true)
                }
              />
              <Label
                htmlFor="include-borrower-signature"
                className="text-xs font-normal"
              >
                Use saved signature
              </Label>
            </div>
            <div className="sm:col-span-2">
              <DatePicker
                id="borrower-date-signed"
                value={value.borrowerDateSigned}
                onChange={(next) => onChange('borrowerDateSigned', next)}
                placeholder="Select borrower signing date"
              />
            </div>
          </div>

          {lenders.map((lender, index) => {
            const included =
              value.lenderSignaturesIncluded?.[lender.email] !== false;
            return (
              <div
                key={lender.email}
                className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{lender.name}</p>
                    <Badge variant="secondary">
                      {lenders.length > 1 ? `Lender ${index + 1}` : 'Lender'}
                    </Badge>
                    <SignatureStatus available={Boolean(lender.eSignatureUrl)} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {lender.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`include-lender-signature-${lender.email}`}
                    checked={included}
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
                    Use saved signature
                  </Label>
                </div>
                <div className="sm:col-span-2">
                  <DatePicker
                    id={`lender-date-signed-${lender.email}`}
                    value={value.lenderDateSigned[lender.email] ?? ''}
                    onChange={(next) =>
                      onChange('lenderDateSigned', {
                        ...value.lenderDateSigned,
                        [lender.email]: next,
                      })
                    }
                    placeholder="Select lender signing date"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Witnesses</p>
            <p className="text-xs text-muted-foreground">
              Search saved witnesses, borrowers, and investors to reuse their
              details, valid ID, and signature.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-witnesses"
              checked={value.includeWitnesses}
              onCheckedChange={(checked) =>
                onChange('includeWitnesses', checked === true)
              }
            />
            <Label htmlFor="include-witnesses" className="text-xs font-normal">
              Include witnesses
            </Label>
          </div>
        </div>

        {value.includeWitnesses ? (
          <>
            <WitnessEditor
              number={1}
              value={value}
              contacts={contacts}
              onChanges={onChanges}
              onWitnessCreated={handleWitnessCreated}
            />

            <div className="flex items-center gap-2">
              <Checkbox
                id="include-second-witness"
                checked={value.includeSecondWitness}
                onCheckedChange={(checked) =>
                  onChange('includeSecondWitness', checked === true)
                }
              />
              <Label
                htmlFor="include-second-witness"
                className="text-sm font-normal"
              >
                Add a second witness
              </Label>
            </div>

            {value.includeSecondWitness ? (
              <WitnessEditor
                number={2}
                value={value}
                contacts={contacts}
                onChanges={onChanges}
                onWitnessCreated={handleWitnessCreated}
              />
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Witness blocks will not be included in this contract.
          </div>
        )}
      </div>
    </div>
  );
}
