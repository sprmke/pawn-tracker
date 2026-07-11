import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { loanSigningInvitations } from '@/db/schema';
import { isValidSignatureDataUrl } from '@/lib/loan-signing';
import {
  buildSigningPagePayload,
  loadSigningInvitationByToken,
} from '@/lib/loan-signing-server';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const invitation = await loadSigningInvitationByToken(token);

    if (!invitation?.loan || !invitation.contract) {
      return NextResponse.json({ error: 'Signing link not found' }, { status: 404 });
    }

    const payload = await buildSigningPagePayload(invitation);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error loading signing page:', error);
    return NextResponse.json(
      { error: 'Failed to load signing page' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const invitation = await loadSigningInvitationByToken(token);

    if (!invitation?.loan || !invitation.contract) {
      return NextResponse.json({ error: 'Signing link not found' }, { status: 404 });
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Signing link has expired' }, { status: 410 });
    }

    const body = await request.json();

    if (body.action !== 'sign') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (invitation.signedAt) {
      return NextResponse.json(
        {
          error:
            'This signature slot has already been signed and cannot be changed.',
        },
        { status: 409 },
      );
    }

    if (body.consentAccepted !== true) {
      return NextResponse.json(
        {
          error:
            'You must accept the terms and consent to sign electronically.',
        },
        { status: 400 },
      );
    }

    const signatureDataUrl = String(body.signatureDataUrl ?? '');
    if (!isValidSignatureDataUrl(signatureDataUrl)) {
      return NextResponse.json(
        { error: 'A valid drawn signature is required.' },
        { status: 400 },
      );
    }

    const now = new Date();
    await db
      .update(loanSigningInvitations)
      .set({
        signatureDataUrl,
        signedAt: now,
        consentedAt: now,
        updatedAt: now,
      })
      .where(eq(loanSigningInvitations.id, invitation.id));

    const updated = await loadSigningInvitationByToken(token);
    if (!updated?.loan || !updated.contract) {
      return NextResponse.json({ error: 'Signing link not found' }, { status: 404 });
    }

    const payload = await buildSigningPagePayload(updated);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error submitting signature:', error);
    return NextResponse.json(
      { error: 'Failed to submit signature' },
      { status: 500 },
    );
  }
}
