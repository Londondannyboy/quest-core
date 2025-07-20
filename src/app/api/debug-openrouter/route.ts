import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    environment: {
      hasOpenRouterKey: !!process.env.OPEN_ROUTER_API_KEY,
      openRouterKeyPrefix: process.env.OPEN_ROUTER_API_KEY?.substring(0, 8) + '...',
      baseURL: process.env.OPENROUTER_BASE_URL,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Debug OpenRouter] Starting test...');
    
    // Test the AI client directly
    const response = await aiClient.generateResponse({
      sessionId: 'debug-test',
      userId: 'debug-user', 
      coach: 'master',
      message: 'Test OpenRouter connection',
      context: { debug: true }
    });

    console.log('[Debug OpenRouter] Success!', {
      model: response.model,
      cost: response.cost,
      tokens: response.tokensUsed
    });

    return NextResponse.json({
      status: 'success',
      openRouterWorking: true,
      response: {
        model: response.model,
        cost: response.cost,
        tokensUsed: response.tokensUsed,
        responseTime: response.responseTime,
        contentLength: response.content.length
      }
    });

  } catch (error) {
    console.error('[Debug OpenRouter] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      openRouterWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        hasKey: !!process.env.OPEN_ROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL
      }
    }, { status: 500 });
  }
}