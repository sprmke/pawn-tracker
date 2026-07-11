import { NextResponse } from 'next/server';
import { db } from '@/db';
import { borrowers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import {
  normalizeValidIdUrl,
  normalizeSignatureImageUrl,
} from '@/lib/valid-id-document';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const borrowerId = parseInt(id, 10);
    if (Number.isNaN(borrowerId)) {
      return NextResponse.json({ error: 'Invalid borrower ID' }, { status: 400 });
    }

    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, borrowerId),
        eq(borrowers.userId, session.user.id),
      ),
      with: {
        loans: {
          columns: { id: true },
        },
      },
    });

    if (!borrower) {
      return NextResponse.json({ error: 'Borrower not found' }, { status: 404 });
    }

    return NextResponse.json(borrower);
  } catch (error) {
    console.error('Error fetching borrower:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrower' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const borrowerId = parseInt(id, 10);
    if (Number.isNaN(borrowerId)) {
      return NextResponse.json({ error: 'Invalid borrower ID' }, { status: 400 });
    }

    const existingBorrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, borrowerId),
        eq(borrowers.userId, session.user.id),
      ),
    });

    if (!existingBorrower) {
      return NextResponse.json({ error: 'Borrower not found' }, { status: 404 });
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Borrower name is required' },
        { status: 400 },
      );
    }

    const updatedBorrower = await db
      .update(borrowers)
      .set({
        name: body.name.trim(),
        contactNumber: body.contactNumber || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
        validIdUrl: normalizeValidIdUrl(body.validIdUrl),
        eSignatureUrl: normalizeSignatureImageUrl(body.eSignatureUrl),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(borrowers.id, borrowerId),
          eq(borrowers.userId, session.user.id),
        ),
      )
      .returning();

    return NextResponse.json(updatedBorrower[0]);
  } catch (error) {
    console.error('Error updating borrower:', error);
    return NextResponse.json(
      { error: 'Failed to update borrower' },
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
    const borrowerId = parseInt(id, 10);
    if (Number.isNaN(borrowerId)) {
      return NextResponse.json({ error: 'Invalid borrower ID' }, { status: 400 });
    }

    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, borrowerId),
        eq(borrowers.userId, session.user.id),
      ),
      with: {
        loans: {
          columns: { id: true },
        },
      },
    });

    if (!borrower) {
      return NextResponse.json({ error: 'Borrower not found' }, { status: 404 });
    }

    if (borrower.loans.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete borrower with existing loans',
          details: `This borrower has ${borrower.loans.length} loan(s)`,
        },
        { status: 400 },
      );
    }

    await db
      .delete(borrowers)
      .where(
        and(
          eq(borrowers.id, borrowerId),
          eq(borrowers.userId, session.user.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting borrower:', error);
    return NextResponse.json(
      { error: 'Failed to delete borrower' },
      { status: 500 },
    );
  }
}
