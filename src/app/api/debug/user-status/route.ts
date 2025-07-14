import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    console.log('=== USER DEBUG ===');
    console.log('Clerk userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        clerkUserId: null,
        databaseUser: null,
        message: 'Not authenticated with Clerk'
      });
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        surfaceProfile: true,
        workExperiences: {
          include: {
            company: true
          }
        }
      }
    });

    console.log('Database user found:', !!dbUser);
    console.log('Database user data:', dbUser);

    return NextResponse.json({
      authenticated: true,
      clerkUserId: userId,
      databaseUser: dbUser,
      hasProfile: !!dbUser?.surfaceProfile,
      workExperiencesCount: dbUser?.workExperiences?.length || 0
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}