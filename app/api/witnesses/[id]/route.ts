import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { witnesses } from '@/db/schema';
import { invalidateWitnessData } from '@/lib/cache-invalidation';
import {
  normalizeSignatureImageUrl,
  normalizeValidIdUrl,
} from '@/lib/valid-id-document';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getOwnedWitness(id: number, userId: string) {
  return db.query.witnesses.findFirst({
    where: and(eq(witnesses.id, id), eq(witnesses.userId, userId)),
  });
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const witnessId = Number.parseInt(id, 10);
  if (!Number.isFinite(witnessId)) {
    return NextResponse.json({ error: 'Invalid witness ID' }, { status: 400 });
  }

  const witness = await getOwnedWitness(witnessId, session.user.id);
  if (!witness) {
    return NextResponse.json({ error: 'Witness not found' }, { status: 404 });
  }
  return NextResponse.json(witness);
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const witnessId = Number.parseInt(id, 10);
    if (
      !Number.isFinite(witnessId) ||
      !(await getOwnedWitness(witnessId, session.user.id))
    ) {
      return NextResponse.json({ error: 'Witness not found' }, { status: 404 });
    }

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Witness name is required' },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(witnesses)
      .set({
        name: body.name.trim(),
        email: body.email?.trim() || null,
        contactNumber: body.contactNumber?.trim() || null,
        address: body.address?.trim() || null,
        validIdUrl: normalizeValidIdUrl(body.validIdUrl),
        eSignatureUrl: normalizeSignatureImageUrl(body.eSignatureUrl),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(witnesses.id, witnessId),
          eq(witnesses.userId, session.user.id),
        ),
      )
      .returning();

    invalidateWitnessData();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating witness:', error);
    return NextResponse.json(
      { error: 'Failed to update witness' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const witnessId = Number.parseInt(id, 10);
    if (
      !Number.isFinite(witnessId) ||
      !(await getOwnedWitness(witnessId, session.user.id))
    ) {
      return NextResponse.json({ error: 'Witness not found' }, { status: 404 });
    }

    await db
      .delete(witnesses)
      .where(
        and(
          eq(witnesses.id, witnessId),
          eq(witnesses.userId, session.user.id),
        ),
      );

    invalidateWitnessData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting witness:', error);
    return NextResponse.json(
      { error: 'Failed to delete witness' },
      { status: 500 },
    );
  }
}
