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
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-10">
      <ContractSigningClient token={token} initialData={data} />
    </div>
  );
}
