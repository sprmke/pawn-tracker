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
import { Loader2, CheckCircle2, FileText, PenLine, ShieldCheck } from 'lucide-react';
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

interface ContractSigningPayload {
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

const signingCardHeaderClass = 'space-y-1 p-5 pb-3 sm:p-6 sm:pb-4 md:p-7 md:pb-5';
const signingCardContentClass = 'p-5 pt-0 sm:p-6 sm:pt-0 md:p-7 md:pt-0';
const signingCardTitleClass = 'text-base sm:text-lg';

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
  const hasSignature = Boolean(signatureDataUrl);
  const canSubmit = hasSignature && consentChecked && !isSubmitting;

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
      <Card className="mx-auto max-w-2xl rounded-3xl border-amber-300 bg-amber-50/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-amber-900">Signing Link Expired</CardTitle>
        </CardHeader>
        <CardContent className="text-base leading-relaxed text-amber-800">
          This signing link is no longer valid. Please contact the loan
          administrator to request a new link.
        </CardContent>
      </Card>
    );
  }

  if (data.signedAt) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 md:space-y-8">
        <Card className="rounded-2xl border-green-200 bg-green-50/50 sm:rounded-3xl">
          <CardContent className="flex items-start gap-3 p-5 sm:gap-4 sm:p-6 md:p-7">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 motion-safe:animate-pulse sm:h-6 sm:w-6" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-green-900 sm:text-xl">
                Signature Recorded
              </p>
              <p className="text-sm leading-relaxed text-green-800 sm:text-base">
                {getSignedConfirmationMessage(data.partyRole, displayName)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl shadow-sm">
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
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-28 sm:space-y-6 sm:pb-32 md:space-y-8 md:pb-12">
      <Card className="overflow-hidden rounded-3xl border-primary/20 bg-linear-to-br from-primary/8 via-background to-background shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Sign Loan Agreement
            </h1>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs">
              {roleLabel}
            </Badge>
          </div>
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            You are signing as <strong>{displayName}</strong>. Review the
            contract, complete your signature, accept electronic consent, and
            submit. Only your signature block is editable in this session.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                1. Review Contract
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                Done
              </span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-medium',
                hasSignature
                  ? 'border-green-200 bg-green-50/60 text-green-900'
                  : 'border-border bg-background/90',
              )}
            >
              <span className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                2. Add Signature
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  hasSignature
                    ? 'bg-green-100 text-green-800'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {hasSignature ? 'Done' : 'Pending'}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-medium',
                consentChecked
                  ? 'border-green-200 bg-green-50/60 text-green-900'
                  : 'border-border bg-background/90',
              )}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                3. Confirm & Submit
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  isSubmitting
                    ? 'bg-blue-100 text-blue-800 motion-safe:animate-pulse'
                    : consentChecked
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {isSubmitting ? 'Submitting' : consentChecked ? 'Ready' : 'Pending'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-start">
        <Card className="overflow-hidden rounded-3xl shadow-sm">
          <CardHeader className={signingCardHeaderClass}>
            <CardTitle className={signingCardTitleClass}>
              Contract Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LoanContractDocumentBody
              data={previewContract.data}
              customization={previewContract.customization}
              signingContext={signingContext}
              variant="compact"
            />
          </CardContent>
        </Card>

        <div className="space-y-5 xl:sticky xl:top-6">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className={signingCardHeaderClass}>
              <CardTitle className={signingCardTitleClass}>
                {displayName} ({roleLabel}) - Signature
              </CardTitle>
            </CardHeader>
            <CardContent className={signingCardContentClass}>
              <SignaturePad onChange={setSignatureDataUrl} />
              <div className="mt-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Live preview updates as you draw. Your signature stays on this
                  device and is sent only when you click submit.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader className={signingCardHeaderClass}>
              <CardTitle className={signingCardTitleClass}>
                {consent.heading}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn(signingCardContentClass, 'space-y-4 sm:space-y-5')}
            >
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="signing-consent"
                    checked={consentChecked}
                    onCheckedChange={(checked) => setConsentChecked(checked === true)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="signing-consent"
                    className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground sm:text-base"
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
              </div>

              <Dialog
                open={consentDetailsOpen}
                onOpenChange={setConsentDetailsOpen}
              >
                <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-5 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {consent.heading}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {consent.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 48)}
                        className="text-sm leading-relaxed text-muted-foreground sm:text-base"
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
                className="hidden h-12 w-full text-base xl:flex"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Signature...
                  </>
                ) : (
                  consent.submitLabel
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/85 xl:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {hasSignature && consentChecked
                ? 'Ready to submit signature'
                : 'Complete steps to submit'}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasSignature ? 'Signature added' : 'Signature missing'} ·{' '}
              {consentChecked ? 'Consent confirmed' : 'Consent pending'}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-11 shrink-0 px-5 text-sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Signature'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
