import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiClient, CoachingSession } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const { coach, message, testMode } = await request.json();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Test connection first
    const isConnected = await aiClient.testConnection();
    if (!isConnected) {
      return NextResponse.json({ 
        error: 'OpenRouter connection failed',
        details: 'Check OPEN_ROUTER_API_KEY environment variable'
      }, { status: 500 });
    }
    
    // Create test coaching session
    const session: CoachingSession = {
      sessionId: `test-${Date.now()}`,
      userId,
      coach: coach || 'master',
      message: message || 'Hello, I need some professional development advice.',
      context: {
        userProfile: { name: 'Test User' },
        trinity: { quest: 'Growth', service: 'Help others', pledge: 'Continuous learning' },
        testMode: true
      }
    };
    
    // Generate AI response
    const startTime = Date.now();
    const response = await aiClient.generateResponse(session);
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      testMode,
      connection: 'OpenRouter connected successfully',
      coach: session.coach,
      response: {
        content: response.content,
        model: response.model,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
        responseTime: response.responseTime
      },
      totalTime,
      costData: aiClient.getCostData(userId),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test AI Client] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'AI client test failed',
      details: String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test connection and get basic info
    const isConnected = await aiClient.testConnection();
    
    // Get authenticated user for cost data
    const { userId } = await auth();
    
    return NextResponse.json({
      status: 'OpenRouter AI Client Status',
      connected: isConnected,
      environment: {
        hasApiKey: !!process.env.OPEN_ROUTER_API_KEY,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
      },
      costTracking: userId ? aiClient.getCostData(userId) : 'Not authenticated',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test AI Client GET] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Status check failed',
      connected: false
    }, { status: 500 });
  }
}