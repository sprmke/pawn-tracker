import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { borrowers } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { normalizeValidIdUrl, normalizeSignatureImageUrl } from '@/lib/valid-id-document';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const simple = request.nextUrl.searchParams.get('simple') === 'true';

    const allBorrowers = await db.query.borrowers.findMany({
      where: eq(borrowers.userId, session.user.id),
      ...(simple
        ? {
            columns: {
              id: true,
              name: true,
              contactNumber: true,
              email: true,
              address: true,
              validIdUrl: true,
              eSignatureUrl: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          }
        : {}),
      orderBy: (borrowersTable, { asc }) => [asc(borrowersTable.name)],
    });

    return NextResponse.json(allBorrowers);
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

    return NextResponse.json(newBorrower[0], { status: 201 });
  } catch (error) {
    console.error('Error creating borrower:', error);
    return NextResponse.json(
      { error: 'Failed to create borrower' },
      { status: 500 },
    );
  }
}
