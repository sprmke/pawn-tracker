import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { investors, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { normalizeValidIdUrl, normalizeSignatureImageUrl } from '@/lib/valid-id-document';
import { getCachedInvestors } from '@/lib/cached-data';
import { invalidateInvestorData } from '@/lib/cache-invalidation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const simple = request.nextUrl.searchParams.get('simple') === 'true';

    return NextResponse.json(
      await getCachedInvestors(session.user.id, simple),
    );
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
        name: body.name,
        email: body.email,
        contactNumber: body.contactNumber || null,
        address: body.address || null,
        validIdUrl: normalizeValidIdUrl(body.validIdUrl),
        eSignatureUrl: normalizeSignatureImageUrl(body.eSignatureUrl),
        userId: session.user.id,
        investorUserId: investorUser.id,
      })
      .returning();
    invalidateInvestorData();
    return NextResponse.json(newInvestor[0], { status: 201 });
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json(
      { error: 'Failed to create investor' },
      { status: 500 }
    );
  }
}
