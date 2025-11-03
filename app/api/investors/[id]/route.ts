import { NextResponse } from 'next/server';
import { db } from '@/db';
import { investors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investorId = parseInt(id);

    const investor = await db.query.investors.findFirst({
      where: and(
        eq(investors.id, investorId),
        eq(investors.userId, session.user.id)
      ),
      with: {
        loanInvestors: {
          with: {
            loan: true,
          },
        },
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
        },
      },
    });

    if (!investor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(investor);
  } catch (error) {
    console.error('Error fetching investor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investorId = parseInt(id);
    const body = await request.json();

    // Verify ownership
    const existingInvestor = await db.query.investors.findFirst({
      where: and(
        eq(investors.id, investorId),
        eq(investors.userId, session.user.id)
      ),
    });

    if (!existingInvestor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      );
    }

    const updatedInvestor = await db
      .update(investors)
      .set({
        name: body.name,
        email: body.email,
        contactNumber: body.contactNumber || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(investors.id, investorId), eq(investors.userId, session.user.id))
      )
      .returning();

    return NextResponse.json(updatedInvestor[0]);
  } catch (error) {
    console.error('Error updating investor:', error);
    return NextResponse.json(
      { error: 'Failed to update investor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investorId = parseInt(id);

    // Check if investor has any loans or transactions and verify ownership
    const investor = await db.query.investors.findFirst({
      where: and(
        eq(investors.id, investorId),
        eq(investors.userId, session.user.id)
      ),
      with: {
        loanInvestors: true,
        transactions: true,
      },
    });

    if (!investor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      );
    }

    if (investor.loanInvestors.length > 0 || investor.transactions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete investor with existing loans or transactions',
          details: `This investor has ${investor.loanInvestors.length} loan(s) and ${investor.transactions.length} transaction(s)`,
        },
        { status: 400 }
      );
    }

    // Delete investor
    await db
      .delete(investors)
      .where(
        and(eq(investors.id, investorId), eq(investors.userId, session.user.id))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return NextResponse.json(
      { error: 'Failed to delete investor' },
      { status: 500 }
    );
  }
}
