import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all educational institutions
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const institutions = await prisma.educationalInstitution.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        website: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            userEducation: true
          }
        }
      }
    });

    return NextResponse.json(institutions);
  } catch (error) {
    console.error('Error fetching educational institutions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new educational institution
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, country, website } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Institution name is required' }, { status: 400 });
    }

    // Check if institution already exists
    const existingInstitution = await prisma.educationalInstitution.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingInstitution) {
      return NextResponse.json({ error: 'Institution with this name already exists' }, { status: 409 });
    }

    // Validate institution type
    const validTypes = ['university', 'college', 'community_college', 'trade_school', 'bootcamp', 'online_platform', 'other'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid institution type' }, { status: 400 });
    }

    const institution = await prisma.educationalInstitution.create({
      data: {
        name: name.trim(),
        type: type || 'university',
        country: country && typeof country === 'string' ? country.trim() : undefined,
        website: website && typeof website === 'string' ? website.trim() : undefined,
        verified: false
      }
    });

    return NextResponse.json(institution, { status: 201 });
  } catch (error) {
    console.error('Error creating educational institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}