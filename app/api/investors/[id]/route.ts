import { NextResponse } from 'next/server';
import { db } from '@/db';
import { investors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const investorId = parseInt(params.id);

    const investor = await db.query.investors.findFirst({
      where: eq(investors.id, investorId),
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
  { params }: { params: { id: string } }
) {
  try {
    const investorId = parseInt(params.id);
    const body = await request.json();

    // Check if email is being changed and if it's already in use
    if (body.email) {
      const existingInvestor = await db.query.investors.findFirst({
        where: eq(investors.email, body.email),
      });

      if (existingInvestor && existingInvestor.id !== investorId) {
        return NextResponse.json(
          { error: 'Email address is already in use by another investor' },
          { status: 400 }
        );
      }
    }

    const updatedInvestor = await db
      .update(investors)
      .set({
        name: body.name,
        email: body.email,
        contactNumber: body.contactNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(investors.id, investorId))
      .returning();

    if (updatedInvestor.length === 0) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      );
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const investorId = parseInt(params.id);

    // Check if investor has any loans or transactions
    const investor = await db.query.investors.findFirst({
      where: eq(investors.id, investorId),
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
    await db.delete(investors).where(eq(investors.id, investorId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return NextResponse.json(
      { error: 'Failed to delete investor' },
      { status: 500 }
    );
  }
}
