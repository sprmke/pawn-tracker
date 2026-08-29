import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { witnesses } from '@/db/schema';
import { invalidateWitnessData } from '@/lib/cache-invalidation';
import { getCachedWitnesses } from '@/lib/cached-data';
import {
  normalizeSignatureImageUrl,
  normalizeValidIdUrl,
} from '@/lib/valid-id-document';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
    const allWitnesses = await getCachedWitnesses(session.user.id);
    const filtered = query
      ? allWitnesses.filter((witness) =>
          [witness.name, witness.email, witness.contactNumber].some((value) =>
            value?.toLowerCase().includes(query),
          ),
        )
      : allWitnesses;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching witnesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch witnesses' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Witness name is required' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(witnesses)
      .values({
        userId: session.user.id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        contactNumber: body.contactNumber?.trim() || null,
        address: body.address?.trim() || null,
        validIdUrl: normalizeValidIdUrl(body.validIdUrl),
        eSignatureUrl: normalizeSignatureImageUrl(body.eSignatureUrl),
      })
      .returning();

    invalidateWitnessData();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating witness:', error);
    return NextResponse.json(
      { error: 'Failed to create witness' },
      { status: 500 },
    );
  }
}
