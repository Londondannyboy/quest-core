import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's comprehensive deep repository
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('includeAll') === 'true';

    const userWithDeep = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        trinityCore: true,
        trinityEvolution: {
          orderBy: { createdAt: 'desc' },
          take: includeAll ? undefined : 10
        },
        deepInsights: {
          where: { isArchived: false },
          orderBy: { generatedAt: 'desc' },
          take: includeAll ? undefined : 20
        },
        careerPathAnalysis: {
          orderBy: { lastAnalyzed: 'desc' },
          take: includeAll ? undefined : 5
        },
        skillEvolutionAnalysis: {
          orderBy: { lastUpdated: 'desc' },
          take: includeAll ? undefined : 10
        },
        repoHealthMetrics: {
          orderBy: { calculatedAt: 'desc' },
          take: includeAll ? undefined : 5
        },
        crossLayerInsights: {
          where: { status: 'active' },
          orderBy: { generatedAt: 'desc' },
          take: includeAll ? undefined : 15
        }
      }
    });

    return NextResponse.json({
      trinityCore: userWithDeep?.trinityCore || null,
      trinityEvolution: userWithDeep?.trinityEvolution || [],
      insights: userWithDeep?.deepInsights || [],
      careerPathAnalysis: userWithDeep?.careerPathAnalysis || [],
      skillEvolutionAnalysis: userWithDeep?.skillEvolutionAnalysis || [],
      repoHealthMetrics: userWithDeep?.repoHealthMetrics || [],
      crossLayerInsights: userWithDeep?.crossLayerInsights || []
    });

  } catch (error) {
    console.error('Error fetching deep repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/Update Deep Repository (usually system-managed)
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();

    const body = await request.json();
    const { trinityCore, insights } = body;

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