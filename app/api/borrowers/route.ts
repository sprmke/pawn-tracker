import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { borrowers } from '@/db/schema';
import { auth } from '@/auth';
import { normalizeValidIdUrl, normalizeSignatureImageUrl } from '@/lib/valid-id-document';
import { getCachedBorrowers } from '@/lib/cached-data';
import { invalidateBorrowerData } from '@/lib/cache-invalidation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const simple = request.nextUrl.searchParams.get('simple') === 'true';

    const allBorrowers = await getCachedBorrowers(session.user.id);
    return NextResponse.json(
      simple
        ? allBorrowers.map(
            ({
              id,
              name,
              contactNumber,
              email,
              address,
              validIdUrl,
              eSignatureUrl,
              notes,
              createdAt,
              updatedAt,
            }) => ({
              id,
              name,
              contactNumber,
              email,
              address,
              validIdUrl,
              eSignatureUrl,
              notes,
              createdAt,
              updatedAt,
            }),
          )
        : allBorrowers,
    );
  } catch (error) {
    console.error('Error fetching borrowers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrowers' },
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
        { error: 'Borrower name is required' },
        { status: 400 },
      );
    }

    const newBorrower = await db
      .insert(borrowers)
      .values({
        userId: session.user.id,
        name: body.name.trim(),
        contactNumber: body.contactNumber || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
        validIdUrl: normalizeValidIdUrl(body.validIdUrl),
        eSignatureUrl: normalizeSignatureImageUrl(body.eSignatureUrl),
      })
      .returning();

    invalidateBorrowerData();
    return NextResponse.json(newBorrower[0], { status: 201 });
  } catch (error) {
    console.error('Error creating borrower:', error);
    return NextResponse.json(
      { error: 'Failed to create borrower' },
      { status: 500 },
    );
  }
}
