import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';
import { prisma } from '@/lib/prisma';

/**
 * Extract and store high-level insights from Zep into PostgreSQL
 * This follows the correct pattern: Raw conversations → Zep → Processed insights → PostgreSQL
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    // Initialize Zep client
    const zepClient = new QuestZepClient();
    
    // Get session summary from Zep (this includes processed insights)
    const sessionSummary = await zepClient.getSessionSummary(sessionId);
    
    if (!sessionSummary) {
      return NextResponse.json({
        message: 'No session summary available yet'
      });
    }
    
    // Store high-level insights in PostgreSQL (not raw conversation)
    const storedInsights = [];
    
    // Store Trinity evolution if significant
    if (sessionSummary.trinityEvolution && sessionSummary.trinityEvolution.confidence && sessionSummary.trinityEvolution.confidence > 0.7) {
      const trinityInsight = await prisma.deepInsight.create({
        data: {
          userId: userId,
          insightType: 'trinity',
          category: 'personal',
          title: 'Trinity Evolution from Voice Session',
          description: `Trinity insights evolved during voice coaching session`,
          aiAnalysis: sessionSummary.trinityEvolution as any,
          confidenceScore: sessionSummary.trinityEvolution.confidence,
          dataSource: 'conversation',
          triggerEvent: 'zep_session_summary'
        }
      });
      storedInsights.push(trinityInsight);
    }
    
    // Store key behavioral patterns
    for (const keyPoint of sessionSummary.keyPoints) {
      const insight = await prisma.deepInsight.create({
        data: {
          userId: userId,
          insightType: 'pattern',
          category: 'professional',
          title: 'Behavioral Pattern from Voice Session',
          description: keyPoint,
          confidenceScore: 0.8, // Zep-extracted insights are generally reliable
          dataSource: 'conversation',
          triggerEvent: 'zep_key_points'
        }
      });
      storedInsights.push(insight);
    }
    
    // Store recommendations for future sessions
    for (const recommendation of sessionSummary.nextSessionRecommendations) {
      const insight = await prisma.deepInsight.create({
        data: {
          userId: userId,
          insightType: 'goal',
          category: 'learning',
          title: 'Next Session Recommendation',
          description: recommendation,
          confidenceScore: 0.7,
          actionable: true,
          dataSource: 'conversation',
          triggerEvent: 'zep_recommendations'
        }
      });
      storedInsights.push(insight);
    }
    
    console.log('[Zep Insights] Stored', storedInsights.length, 'insights from session', sessionId);
    
    return NextResponse.json({
      success: true,
      insightsStored: storedInsights.length,
      sessionSummary: {
        keyPoints: sessionSummary.keyPoints.length,
        trinityEvolution: sessionSummary.trinityEvolution?.confidence || 0,
        recommendations: sessionSummary.nextSessionRecommendations.length
      }
    });
    
  } catch (error) {
    console.error('[Zep Insights] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to extract insights from Zep'
    }, { status: 500 });
  }
}