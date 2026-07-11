import { notFound } from 'next/navigation';
import { ContractSigningClient } from '@/components/signing/contract-signing-client';
import {
  buildSigningPagePayload,
  loadSigningInvitationByToken,
} from '@/lib/loan-signing-server';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

export default async function SignPage({ params }: SignPageProps) {
  const { token } = await params;
  const invitation = await loadSigningInvitationByToken(token);

  if (!invitation?.loan || !invitation.contract) {
    notFound();
  }

  const data = await buildSigningPagePayload(invitation);

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-3 sm:px-4 sm:py-5 md:px-6 md:py-8">
      <ContractSigningClient token={token} initialData={data} />
    </div>
  );
}
