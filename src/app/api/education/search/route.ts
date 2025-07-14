import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Search educational institutions (for autocomplete)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const institutions = await prisma.educationalInstitution.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        website: true,
        verified: true
      },
      orderBy: [
        { verified: 'desc' },
        { name: 'asc' }
      ],
      take: 10
    });

    return NextResponse.json(institutions);
  } catch (error) {
    console.error('Error searching institutions:', error);
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
      return NextResponse.json(existingInstitution);
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
    console.error('Error creating institution:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}