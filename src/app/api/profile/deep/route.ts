import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's deep repository
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        trinityCore: true,
        deepInsights: {
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      trinityCore: user.trinityCore || null,
      insights: user.deepInsights || []
    });

  } catch (error) {
    console.error('Error fetching deep repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/Update Deep Repository (usually system-managed)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trinityCore, insights } = body;

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      let updatedTrinity = null;

      // Handle Trinity Core if provided
      if (trinityCore) {
        updatedTrinity = await tx.trinityCore.upsert({
          where: { userId: user.id },
          update: {
            questAnalysis: trinityCore.questAnalysis || undefined,
            serviceAnalysis: trinityCore.serviceAnalysis || undefined,
            pledgeAnalysis: trinityCore.pledgeAnalysis || undefined,
            coherenceScore: trinityCore.coherenceScore || undefined,
            lastUpdated: new Date()
          },
          create: {
            userId: user.id,
            questAnalysis: trinityCore.questAnalysis || undefined,
            serviceAnalysis: trinityCore.serviceAnalysis || undefined,
            pledgeAnalysis: trinityCore.pledgeAnalysis || undefined,
            coherenceScore: trinityCore.coherenceScore || undefined
          }
        });
      }

      // Handle insights if provided (usually system-generated)
      if (insights && insights.length > 0) {
        for (const insight of insights) {
          await tx.deepInsight.create({
            data: {
              userId: user.id,
              insightType: insight.insightType || 'general',
              aiAnalysis: insight.aiAnalysis || undefined,
              confidenceScore: insight.confidenceScore || 0.5
            }
          });
        }
      }

      return { trinityCore: updatedTrinity };
    });

    return NextResponse.json({ 
      message: 'Deep repository saved successfully',
      result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving deep repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}