import { NextResponse } from 'next/server';
import { db } from '@/db';
import { investors } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allInvestors = await db.query.investors.findMany({
      where: eq(investors.userId, session.user.id),
      with: {
        loanInvestors: {
          with: {
            loan: true,
          },
        },
        transactions: true,
      },
    });
    return NextResponse.json(allInvestors);
  } catch (error) {
    console.error('Error fetching investors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investors' },
      { status: 500 }
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
    const newInvestor = await db
      .insert(investors)
      .values({ ...body, userId: session.user.id })
      .returning();
    return NextResponse.json(newInvestor[0], { status: 201 });
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json(
      { error: 'Failed to create investor' },
      { status: 500 }
    );
  }
}
