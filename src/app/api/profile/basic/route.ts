import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface BasicProfile {
  headline?: string;
  location?: string;
  about?: string;
}

// POST - Save basic profile info
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profile } = body;

    if (!profile || typeof profile !== 'object') {
      return NextResponse.json({ error: 'profile data is required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or update surface profile
    const surfaceProfile = await prisma.surfaceProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: profile.headline && profile.headline.trim() !== '' ? profile.headline.trim() : null,
        location: profile.location && profile.location.trim() !== '' ? profile.location.trim() : null,
        publicBio: profile.about && profile.about.trim() !== '' ? profile.about.trim() : null
      },
      create: {
        userId: user.id,
        headline: profile.headline && profile.headline.trim() !== '' ? profile.headline.trim() : null,
        location: profile.location && profile.location.trim() !== '' ? profile.location.trim() : null,
        publicBio: profile.about && profile.about.trim() !== '' ? profile.about.trim() : null
      }
    });

    return NextResponse.json({ 
      message: 'Basic profile saved successfully',
      profile: surfaceProfile 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving basic profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's basic profile
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        surfaceProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: user.surfaceProfile
    });

  } catch (error) {
    console.error('Error fetching basic profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}