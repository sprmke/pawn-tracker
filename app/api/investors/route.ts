import { NextResponse } from 'next/server';
import { db } from '@/db';
import { investors } from '@/db/schema';

export async function GET() {
  try {
    const allInvestors = await db.query.investors.findMany({
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
    const body = await request.json();
    const newInvestor = await db.insert(investors).values(body).returning();
    return NextResponse.json(newInvestor[0], { status: 201 });
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json(
      { error: 'Failed to create investor' },
      { status: 500 }
    );
  }
}
