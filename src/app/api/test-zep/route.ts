import { NextRequest, NextResponse } from 'next/server';
import { zepClient } from '@/lib/zep-client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Zep test endpoint available',
    environment: {
      hasZepKey: !!process.env.ZEP_API_KEY,
      zepKeyPrefix: process.env.ZEP_API_KEY?.substring(0, 8) + '...'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action = 'test-connection', userId = 'test-user', message = 'Hello Zep!' } = await request.json();

    console.log('[Zep Test] Starting action:', action);

    if (action === 'test-connection') {
      // Test basic Zep connectivity
      const isConnected = await zepClient.testConnection();
      
      return NextResponse.json({
        status: 'success',
        zepWorking: isConnected,
        action: 'test-connection',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'test-user-flow') {
      // Test complete user flow
      const sessionId = `test-session-${Date.now()}`;
      
      // 1. Initialize user
      await zepClient.initializeUser(userId, 'test@example.com', 'Test User');
      
      // 2. Create session
      await zepClient.createSession(userId, sessionId, 'test-coaching');
      
      // 3. Add messages
      await zepClient.addMessage(sessionId, 'user', message);
      await zepClient.addMessage(sessionId, 'assistant', 'Hello! How can I help you with your professional development?');
      
      // 4. Get context
      const context = await zepClient.getCoachingContext(userId, 'Follow up question', sessionId);
      
      // 5. Test Trinity update
      await zepClient.updateTrinity(userId, {
        quest: 'To help others grow professionally',
        confidence: 0.8
      });

      return NextResponse.json({
        status: 'success',
        zepWorking: true,
        action: 'test-user-flow',
        results: {
          userInitialized: true,
          sessionCreated: true,
          messagesAdded: 2,
          contextRetrieved: {
            relevantFacts: context.relevantFacts.length,
            conversationHistory: context.conversationHistory.length,
            hasTrinity: !!context.trinity
          },
          trinityUpdated: true
        },
        sessionId,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'get-context') {
      // Test context retrieval
      const context = await zepClient.getCoachingContext(userId, message);
      
      return NextResponse.json({
        status: 'success',
        zepWorking: true,
        action: 'get-context',
        context: {
          relevantFacts: context.relevantFacts,
          trinity: context.trinity,
          conversationHistory: context.conversationHistory.map(msg => ({
            role: msg.role,
            contentLength: msg.content.length,
            timestamp: msg.timestamp
          })),
          insights: context.insights
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'error',
      message: 'Unknown action'
    }, { status: 400 });

  } catch (error) {
    console.error('[Zep Test] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      zepWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        hasKey: !!process.env.ZEP_API_KEY
      }
    }, { status: 500 });
  }
}