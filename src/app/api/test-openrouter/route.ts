import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'OpenRouter test endpoint available',
    environment: {
      hasOpenRouter: !!process.env.OPEN_ROUTER_API_KEY,
      openRouterURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message = "Hello, this is a test", coach = "master" } = await request.json();

    console.log('[OpenRouter Test] Testing with:', { message, coach });

    // Test OpenRouter connection with a simple request
    const response = await aiClient.generateResponse({
      sessionId: `test-${Date.now()}`,
      userId: 'test-user',
      coach: coach as any,
      message: message,
      context: { testing: true }
    });

    console.log('[OpenRouter Test] Response received:', {
      model: response.model,
      cost: response.cost,
      tokens: response.tokensUsed,
      responseTime: response.responseTime
    });

    return NextResponse.json({
      status: 'success',
      openRouterWorking: true,
      response: {
        content: response.content,
        model: response.model,
        cost: response.cost,
        tokensUsed: response.tokensUsed,
        responseTime: response.responseTime
      },
      test: {
        coach,
        message,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[OpenRouter Test] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      openRouterWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        hasApiKey: !!process.env.OPEN_ROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL
      }
    }, { status: 500 });
  }
}