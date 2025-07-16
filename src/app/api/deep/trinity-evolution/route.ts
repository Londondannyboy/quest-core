import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch Trinity evolution history or analyze patterns
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const analyze = searchParams.get('analyze');

    if (analyze === 'patterns') {
      const evolution = await prisma.trinityEvolution.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        include: {
          trinityCore: true
        }
      });

      const patterns = analyzeTrinityPatterns(evolution);
      return NextResponse.json(patterns);
    }

    // Default behavior - return evolution history
    const evolution = await prisma.trinityEvolution.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        trinityCore: {
          select: {
            id: true,
            coherenceScore: true,
            maturityLevel: true,
            evolutionStage: true
          }
        }
      }
    });

    return NextResponse.json(evolution);
  } catch (error) {
    console.error('Error fetching Trinity evolution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create Trinity evolution snapshot
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();

    const { 
      trinityId, 
      questSnapshot, 
      serviceSnapshot, 
      pledgeSnapshot, 
      coherenceScore, 
      changeReason,
      significantChange = false
    } = body;

    // Verify user owns the Trinity
    const trinityCore = await prisma.trinityCore.findFirst({
      where: { id: trinityId, userId: user.id }
    });

    if (!trinityCore) {
      return NextResponse.json({ error: 'Trinity not found' }, { status: 404 });
    }

    const evolution = await prisma.trinityEvolution.create({
      data: {
        trinityId,
        userId: user.id,
        questSnapshot,
        serviceSnapshot,
        pledgeSnapshot,
        coherenceScore,
        changeReason,
        significantChange
      },
      include: {
        trinityCore: {
          select: {
            id: true,
            coherenceScore: true,
            maturityLevel: true,
            evolutionStage: true
          }
        }
      }
    });

    return NextResponse.json(evolution, { status: 201 });
  } catch (error) {
    console.error('Error creating Trinity evolution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to analyze Trinity evolution patterns
function analyzeTrinityPatterns(evolution: any[]) {
  if (evolution.length < 2) {
    return {
      pattern: 'insufficient_data',
      message: 'Need more evolution snapshots to identify patterns'
    };
  }

  const coherenceScores = evolution.map(e => e.coherenceScore || 0);
  const latest = evolution[evolution.length - 1];
  const earliest = evolution[0];

  // Calculate trends
  const overallTrend = coherenceScores[coherenceScores.length - 1] - coherenceScores[0];
  const averageScore = coherenceScores.reduce((sum, score) => sum + score, 0) / coherenceScores.length;
  const volatility = calculateVolatility(coherenceScores);

  // Identify change patterns
  const changeReasons = evolution.map(e => e.changeReason);
  const significantChanges = evolution.filter(e => e.significantChange).length;

  // Calculate stability metrics
  const stabilityScore = 1 - volatility;
  const growthRate = overallTrend / evolution.length;

  return {
    pattern: identifyPattern(overallTrend, volatility, growthRate),
    metrics: {
      overallTrend,
      averageScore,
      volatility,
      stabilityScore,
      growthRate,
      significantChanges,
      totalSnapshots: evolution.length
    },
    insights: {
      mostCommonChangeReason: findMostCommon(changeReasons),
      currentMaturityLevel: latest.trinityCore?.maturityLevel || 'unknown',
      evolutionStage: latest.trinityCore?.evolutionStage || 'unknown',
      coherenceJourney: {
        start: earliest.coherenceScore || 0,
        current: latest.coherenceScore || 0,
        peak: Math.max(...coherenceScores),
        low: Math.min(...coherenceScores)
      }
    },
    recommendations: generateEvolutionRecommendations(overallTrend, volatility, latest)
  };
}

function calculateVolatility(scores: number[]): number {
  if (scores.length < 2) return 0;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

function identifyPattern(trend: number, volatility: number, growthRate: number): string {
  if (trend > 0.2 && volatility < 0.1) return 'steady_growth';
  if (trend > 0.1 && volatility > 0.2) return 'volatile_growth';
  if (Math.abs(trend) < 0.1 && volatility < 0.1) return 'stable';
  if (Math.abs(trend) < 0.1 && volatility > 0.2) return 'unstable';
  if (trend < -0.1) return 'declining';
  return 'emerging';
}

function findMostCommon(items: string[]): string {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
}

function generateEvolutionRecommendations(trend: number, volatility: number, latest: any): any[] {
  const recommendations = [];

  if (trend < 0) {
    recommendations.push({
      type: 'coherence_recovery',
      title: 'Rebuild Trinity Coherence',
      description: 'Your Trinity coherence has declined. Consider revisiting your core elements.',
      priority: 'high',
      actions: ['Review Quest alignment', 'Clarify Service definition', 'Strengthen Pledge commitment']
    });
  }

  if (volatility > 0.3) {
    recommendations.push({
      type: 'stability_focus',
      title: 'Stabilize Trinity Elements',
      description: 'Your Trinity shows high volatility. Focus on consistency.',
      priority: 'medium',
      actions: ['Establish regular review schedule', 'Avoid frequent major changes', 'Seek coaching support']
    });
  }

  if (trend > 0.2 && volatility < 0.1) {
    recommendations.push({
      type: 'optimization',
      title: 'Optimize Trinity Integration',
      description: 'Your Trinity is evolving positively. Consider advanced integration techniques.',
      priority: 'low',
      actions: ['Explore Trinity synergies', 'Deepen element connections', 'Share insights with others']
    });
  }

  return recommendations;
}