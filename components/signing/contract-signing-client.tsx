'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoanContractDocumentBody } from '@/components/loans/loan-contract-document-body';
import { SignaturePad } from '@/components/signing/signature-pad';
import {
  getElectronicSignatureConsentText,
  getSignedConfirmationMessage,
  getSigningPartyRoleLabel,
} from '@/lib/loan-signing-consent';
import type { SigningPartyRole } from '@/lib/loan-signing';
import {
  applyLiveSignaturePreview,
  resolveSigningPartyDisplayName,
} from '@/lib/loan-signing';
import type { LoanContractData } from '@/lib/loan-contract-data';
import { normalizeLoanContractData } from '@/lib/loan-contract-data';
import type { ContractCustomization } from '@/lib/loan-contract-customization';

export interface ContractSigningPayload {
  partyRole: SigningPartyRole;
  partyName: string;
  partyEmail: string | null;
  signedAt: string | null;
  signatureDataUrl: string | null;
  contractData: LoanContractData;
  customization: ContractCustomization;
  expired: boolean;
}

interface ContractSigningClientProps {
  token: string;
  initialData: ContractSigningPayload;
}

const signingCardHeaderClass =
  'space-y-1 p-3 pb-2 sm:p-4 sm:pb-3 md:p-6 md:pb-4';
const signingCardContentClass = 'p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0';
const signingCardTitleClass = 'text-sm sm:text-base';

function normalizeSigningPayload(
  payload: ContractSigningPayload,
): ContractSigningPayload {
  return {
    ...payload,
    contractData: normalizeLoanContractData(payload.contractData),
  };
}

export function ContractSigningClient({
  token,
  initialData,
}: ContractSigningClientProps) {
  const [data, setData] = useState(() => normalizeSigningPayload(initialData));
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentDetailsOpen, setConsentDetailsOpen] = useState(false);

  const displayName = useMemo(
    () =>
      resolveSigningPartyDisplayName(
        data.partyRole,
        data.partyName,
        data.customization,
      ),
    [data.partyRole, data.partyName, data.customization],
  );

  const consent = getElectronicSignatureConsentText(data.partyRole, displayName);
  const roleLabel = getSigningPartyRoleLabel(data.partyRole);

  const previewContract = useMemo(() => {
    return applyLiveSignaturePreview(
      data.contractData,
      data.customization,
      data.partyRole,
      signatureDataUrl,
      data.partyEmail,
    );
  }, [
    data.contractData,
    data.customization,
    data.partyRole,
    data.partyEmail,
    signatureDataUrl,
  ]);

  const signingContext = useMemo(
    () => ({
      activePartyRole: data.partyRole,
      activePartyEmail: data.partyEmail,
      showStatusBadges: true,
    }),
    [data.partyRole, data.partyEmail],
  );

  useEffect(() => {
    if (data.signedAt || data.expired) return;

    const refreshSignatures = async () => {
      try {
        const response = await fetch(`/api/sign/${token}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const fresh = (await response.json()) as ContractSigningPayload;
        setData((current) =>
          normalizeSigningPayload({
            ...fresh,
            signedAt: current.signedAt ?? fresh.signedAt,
          }),
        );
      } catch {
        // Ignore polling errors silently
      }
    };

    const intervalId = window.setInterval(refreshSignatures, 10000);
    return () => window.clearInterval(intervalId);
  }, [token, data.signedAt, data.expired]);

  const handleSubmit = async () => {
    if (!signatureDataUrl) {
      toast.error('Please draw your signature before submitting.');
      return;
    }
    if (!consentChecked) {
      toast.error('Please confirm your consent before signing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign',
          signatureDataUrl,
          consentAccepted: true,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? 'Failed to submit signature');
      }
      setData(result);
      toast.success('Your electronic signature has been recorded.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit signature',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (data.expired) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Signing Link Expired</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This signing link is no longer valid. Please contact the loan
          administrator to request a new link.
        </CardContent>
      </Card>
    );
  }

  if (data.signedAt) {
    return (
      <div className="mx-auto space-y-3 w-full max-w-3xl sm:space-y-4 md:space-y-6">
        <Card className="rounded-2xl border-green-200 bg-green-50/50 sm:rounded-3xl">
          <CardContent className="flex items-start gap-2.5 p-3 sm:gap-3 sm:p-4 md:p-6">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 sm:h-5 sm:w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-900 sm:text-base">
                Signature Recorded
              </p>
              <p className="text-xs text-green-800 sm:text-sm">
                {getSignedConfirmationMessage(data.partyRole, displayName)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl sm:rounded-3xl">
          <CardHeader className={signingCardHeaderClass}>
            <CardTitle className={signingCardTitleClass}>
              Signed Contract Preview
            </CardTitle>
          </CardHeader>
          <CardContent
            className={cn(signingCardContentClass, 'p-0 sm:p-0 md:p-0')}
          >
            <LoanContractDocumentBody
              data={data.contractData}
              customization={data.customization}
              signingContext={signingContext}
              variant="compact"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-6 mx-auto space-y-3 w-full max-w-4xl sm:space-y-4 sm:pb-8 md:space-y-6 md:pb-10">
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
            Sign Loan Agreement
          </h1>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {roleLabel}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          You are signing as <strong>{displayName}</strong>. Review the
          contract below, then draw your signature in the box provided for your
          role only.
        </p>
      </div>

      <Card className="overflow-hidden rounded-2xl sm:rounded-3xl">
        <CardHeader className={signingCardHeaderClass}>
          <CardTitle className={signingCardTitleClass}>
            Contract Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0 md:p-0">
          <LoanContractDocumentBody
            data={previewContract.data}
            customization={previewContract.customization}
            signingContext={signingContext}
            variant="compact"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl sm:rounded-3xl">
        <CardHeader className={signingCardHeaderClass}>
          <CardTitle className={signingCardTitleClass}>
            {displayName} ({roleLabel}) - Signature
          </CardTitle>
        </CardHeader>
        <CardContent className={signingCardContentClass}>
          <SignaturePad onChange={setSignatureDataUrl} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl sm:rounded-3xl">
        <CardHeader className={signingCardHeaderClass}>
          <CardTitle className={signingCardTitleClass}>
            {consent.heading}
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn(signingCardContentClass, 'space-y-3 sm:space-y-4')}
        >
          <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/30 p-3 sm:gap-3 sm:p-4">
            <Checkbox
              id="signing-consent"
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="signing-consent"
              className="text-xs font-normal leading-relaxed cursor-pointer text-muted-foreground sm:text-sm"
            >
              {consent.consentDescription}{' '}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setConsentDetailsOpen(true);
                }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {consent.detailsLinkLabel}
              </button>
            </Label>
          </div>

          <Dialog
            open={consentDetailsOpen}
            onOpenChange={setConsentDetailsOpen}
          >
            <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  {consent.heading}
                </DialogTitle>
              </DialogHeader>
              <div className="pt-1 space-y-3 sm:space-y-4 sm:pt-2">
                {consent.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 48)}
                    className="text-xs leading-relaxed text-muted-foreground sm:text-sm"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            size="lg"
            className="w-full h-10 text-sm sm:h-11 sm:w-auto sm:text-base"
            onClick={handleSubmit}
            disabled={isSubmitting || !signatureDataUrl || !consentChecked}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Submitting Signature...
              </>
            ) : (
              consent.submitLabel
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
