'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, CheckCircle2, Clock, Link2 } from 'lucide-react';
import { getSigningPartyRoleLabel } from '@/lib/loan-signing-consent';
import type { SigningInvitationSummary } from '@/lib/loan-signing';
import { formatDate } from '@/lib/format';

interface LoanSigningLinksPanelProps {
  invitations: SigningInvitationSummary[];
}

export function LoanSigningLinksPanel({
  invitations,
}: LoanSigningLinksPanelProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (invitations.length === 0) {
    return null;
  }

  const copyLink = async (invitation: SigningInvitationSummary) => {
    const url = invitation.signingUrl.startsWith('http')
      ? invitation.signingUrl
      : `${window.location.origin}${invitation.signingUrl}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(invitation.token);
      toast.success(`Signing link copied for ${invitation.partyName}.`);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error('Could not copy link. Please try again.');
    }
  };

  const signedCount = invitations.filter((item) => item.signedAt).length;
  let lenderOrdinal = 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Contract E-Signature Links
          </CardTitle>
          <Badge variant="secondary">
            {signedCount} of {invitations.length} signed
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Share each link only with the assigned signer. Once signed, that slot
          is locked.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {invitations.map((invitation) => {
            const isSigned = Boolean(invitation.signedAt);
            const isCopied = copiedToken === invitation.token;
            const lenderIndex =
              invitation.partyRole === 'lender' ? ++lenderOrdinal : undefined;

            const roleLabel = getSigningPartyRoleLabel(
              invitation.partyRole,
              lenderIndex,
            );
            const showRoleSubtitle = roleLabel !== invitation.partyName;

            return (
              <li
                key={invitation.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{invitation.partyName}</p>
                  {showRoleSubtitle ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {roleLabel}
                      {invitation.partyEmail
                        ? ` · ${invitation.partyEmail}`
                        : ''}
                    </p>
                  ) : invitation.partyEmail ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {invitation.partyEmail}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  {isSigned ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Signed {formatDate(invitation.signedAt!)}
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                      <Button
                        type="button"
                        variant={isCopied ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => copyLink(invitation)}
                      >
                        {isCopied ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy link
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
