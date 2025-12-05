import { NextResponse } from 'next/server';
import { db } from '@/db';
import { investors, users, loanInvestors } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get investors created by this user
    const ownedInvestors = await db.query.investors.findMany({
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

    // Get investors from loans where this user is an investor
    const userAsInvestor = await db.query.investors.findFirst({
      where: eq(investors.investorUserId, session.user.id),
    });

    let sharedInvestors: any[] = [];
    if (userAsInvestor) {
      // Get loans where this user is an investor
      const loanInvestments = await db.query.loanInvestors.findMany({
        where: eq(loanInvestors.investorId, userAsInvestor.id),
        with: {
          loan: {
            with: {
              loanInvestors: {
                with: {
                  investor: {
                    with: {
                      loanInvestors: {
                        with: {
                          loan: true,
                        },
                      },
                      transactions: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Extract all investors from these loans
      const investorSet = new Set();
      loanInvestments.forEach(li => {
        li.loan.loanInvestors.forEach(loanInv => {
          if (!investorSet.has(loanInv.investor.id)) {
            investorSet.add(loanInv.investor.id);
            sharedInvestors.push(loanInv.investor);
          }
        });
      });
    }

    // Combine and deduplicate investors
    const allInvestorsMap = new Map();
    [...ownedInvestors, ...sharedInvestors].forEach(investor => {
      allInvestorsMap.set(investor.id, investor);
    });

    const allInvestors = Array.from(allInvestorsMap.values());

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
    
    // Check if a user with this email already exists
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

    // Create the investor record linked to both the admin user and investor user
    const newInvestor = await db
      .insert(investors)
      .values({ 
        ...body, 
        userId: session.user.id,
        investorUserId: investorUser.id,
      })
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
