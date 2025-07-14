import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Search companies by name (for autocomplete)
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

    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        verified: true
      },
      orderBy: [
        { verified: 'desc' }, // Verified companies first
        { name: 'asc' }
      ],
      take: 10 // Limit to 10 results for performance
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error searching companies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new company from user profile (simplified)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, website } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingCompany) {
      return NextResponse.json(existingCompany);
    }

    // Extract domain from website if provided
    let domain: string | undefined;
    if (website && typeof website === 'string') {
      try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`);
        domain = url.hostname;
      } catch {
        // Invalid URL, continue without domain
      }
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        website: website && typeof website === 'string' ? website.trim() : undefined,
        domain,
        verified: false // User-created companies start unverified
      }
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company from profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}