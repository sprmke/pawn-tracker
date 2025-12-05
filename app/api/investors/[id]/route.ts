import { NextResponse } from 'next/server';
import { db } from '@/db';
import { investors, users } from '@/db/schema';
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

    // If email changed, update or create investor user account
    let investorUserId = existingInvestor.investorUserId;
    if (body.email !== existingInvestor.email) {
      // Check if a user with new email already exists
      let investorUser = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      // If no user exists, create one with investor role
      if (!investorUser) {
        const newUser = await db
          .insert(users)
          .values({
            email: body.email,
            name: body.name,
            role: 'investor',
          })
          .returning();
        investorUser = newUser[0];
      }
      
      investorUserId = investorUser.id;
      
      // Update the existing investor user's name if it exists
      if (existingInvestor.investorUserId) {
        await db
          .update(users)
          .set({ name: body.name })
          .where(eq(users.id, existingInvestor.investorUserId));
      }
    } else if (existingInvestor.investorUserId) {
      // Just update the name if email hasn't changed
      await db
        .update(users)
        .set({ name: body.name })
        .where(eq(users.id, existingInvestor.investorUserId));
    }

    const updatedInvestor = await db
      .update(investors)
      .set({
        name: body.name,
        email: body.email,
        contactNumber: body.contactNumber || null,
        investorUserId: investorUserId,
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
