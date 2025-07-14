import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all companies
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        industry: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            workExperiences: true
          }
        }
      }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new company
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, website, industry } = body;

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
      return NextResponse.json({ error: 'Company with this name already exists' }, { status: 409 });
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
        industry: industry && typeof industry === 'string' ? industry.trim() : undefined,
        verified: false
      }
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}