import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple test endpoint to create a company without authentication
export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Starting company creation test...');
    
    const body = await request.json();
    const { name, website, industry } = body;

    console.log('[TEST] Request body:', { name, website, industry });

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log('[TEST] Invalid name provided');
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Test database connection first
    console.log('[TEST] Testing database connection...');
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[TEST] Database connection successful:', connectionTest);

    // Check if company already exists
    console.log('[TEST] Checking for existing company...');
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingCompany) {
      console.log('[TEST] Company already exists:', existingCompany.id);
      return NextResponse.json({ 
        message: 'Company already exists',
        company: existingCompany 
      });
    }

    // Extract domain from website if provided
    let domain: string | undefined;
    if (website && typeof website === 'string') {
      try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`);
        domain = url.hostname;
        console.log('[TEST] Extracted domain:', domain);
      } catch (urlError) {
        console.log('[TEST] Invalid URL provided, continuing without domain');
      }
    }

    console.log('[TEST] Creating company with data:', {
      name: name.trim(),
      website: website && typeof website === 'string' ? website.trim() : undefined,
      domain,
      industry: industry && typeof industry === 'string' ? industry.trim() : undefined,
      verified: false
    });

    // Create the company
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        website: website && typeof website === 'string' ? website.trim() : undefined,
        domain,
        industry: industry && typeof industry === 'string' ? industry.trim() : undefined,
        verified: false
      }
    });

    console.log('[TEST] Company created successfully:', company.id);

    return NextResponse.json({ 
      message: 'Company created successfully',
      company,
      test: true 
    }, { status: 201 });

  } catch (error) {
    console.error('[TEST] Error creating company:', error);
    console.error('[TEST] Error type:', typeof error);
    console.error('[TEST] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[TEST] Error stack:', error instanceof Error ? error.stack : undefined);
    
    // Try to get more specific error details
    if (error && typeof error === 'object') {
      console.error('[TEST] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }

    return NextResponse.json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      test: true
    }, { status: 500 });
  }
}

// GET - Test database connection
export async function GET() {
  try {
    console.log('[TEST] Testing database connection (GET)...');
    
    // Test basic connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[TEST] Database connection test result:', connectionTest);

    // Test company table access
    const companyCount = await prisma.company.count();
    console.log('[TEST] Current company count:', companyCount);

    // Test a simple company query
    const companies = await prisma.company.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        verified: true,
        createdAt: true
      }
    });
    console.log('[TEST] Sample companies:', companies);

    return NextResponse.json({
      message: 'Database test successful',
      connectionTest,
      companyCount,
      sampleCompanies: companies,
      test: true
    });

  } catch (error) {
    console.error('[TEST] Database connection test failed:', error);
    
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      test: true
    }, { status: 500 });
  }
}