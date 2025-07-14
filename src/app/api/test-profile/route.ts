import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to debug profile saving without authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, data } = body;

    console.log('Test endpoint called:', { testType, data });

    // Test database connection first
    if (testType === 'connection') {
      const userCount = await prisma.user.count();
      return NextResponse.json({ 
        success: true, 
        message: `Database connected. User count: ${userCount}` 
      });
    }

    // Test basic profile saving with hardcoded user
    if (testType === 'basic-profile') {
      // Find any existing user for testing
      let testUser = await prisma.user.findFirst();
      
      if (!testUser) {
        // Create a test user if none exists
        testUser = await prisma.user.create({
          data: {
            clerkId: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User'
          }
        });
      }

      // Test surface profile creation/update
      const surfaceProfile = await prisma.surfaceProfile.upsert({
        where: { userId: testUser.id },
        update: {
          headline: data.headline && data.headline.trim() !== '' ? data.headline.trim() : null,
          location: data.location && data.location.trim() !== '' ? data.location.trim() : null,
          publicBio: data.about && data.about.trim() !== '' ? data.about.trim() : null
        },
        create: {
          userId: testUser.id,
          headline: data.headline && data.headline.trim() !== '' ? data.headline.trim() : null,
          location: data.location && data.location.trim() !== '' ? data.location.trim() : null,
          publicBio: data.about && data.about.trim() !== '' ? data.about.trim() : null
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Basic profile saved successfully',
        profile: surfaceProfile,
        testUser: { id: testUser.id, email: testUser.email }
      });
    }

    // Test work experience saving
    if (testType === 'work-experience') {
      let testUser = await prisma.user.findFirst();
      
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            clerkId: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User'
          }
        });
      }

      // Create test company if needed
      let testCompany = await prisma.company.findFirst({
        where: { name: 'Test Company' }
      });

      if (!testCompany) {
        testCompany = await prisma.company.create({
          data: {
            name: 'Test Company',
            industry: 'Technology',
            verified: false
          }
        });
      }

      // Delete existing work experiences for clean test
      await prisma.workExperience.deleteMany({
        where: { userId: testUser.id }
      });

      // Create new work experience
      const workExp = await prisma.workExperience.create({
        data: {
          userId: testUser.id,
          companyId: testCompany.id,
          title: data.position || 'Test Position',
          startDate: data.startDate ? new Date(data.startDate) : new Date('2023-01-01'),
          endDate: data.endDate ? new Date(data.endDate) : null,
          description: data.description || 'Test description',
          isCurrent: data.isCurrentRole || false
        },
        include: {
          company: true
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Work experience saved successfully',
        workExperience: workExp,
        testUser: { id: testUser.id, email: testUser.email }
      });
    }

    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint to check current data
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        surfaceProfile: true,
        workExperiences: {
          include: {
            company: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      users: users
    });

  } catch (error) {
    console.error('Test GET error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}