import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { TemporalGraphManager } from '@/lib/temporal-graph';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();

    // Get career progression insights
    const progression = await TemporalGraphManager.getCareerProgression(user.user.id);

    return NextResponse.json({
      success: true,
      data: progression,
      meta: {
        userId: user.user.id,
        skillCount: progression.skillProgression.length,
        careerSteps: progression.careerPath.length,
        educationCount: progression.educationImpact.length
      }
    });

  } catch (error) {
    console.error('Error fetching career progression:', error);
    return NextResponse.json(
      { error: 'Failed to fetch career progression' },
      { status: 500 }
    );
  }
}