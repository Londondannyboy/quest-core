import { NextRequest, NextResponse } from 'next/server';
import { zepClient } from '@/lib/zep-client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Simple Zep test endpoint'
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Simple Zep Test] Starting...');
    
    const testUserId = `simple-test-${Date.now()}`;
    const sessionId = `simple-session-${Date.now()}`;
    
    // Step 1: Test basic connection
    const connectionTest = await zepClient.testConnection();
    if (!connectionTest) {
      throw new Error('Zep connection failed');
    }
    
    // Step 2: Initialize a user
    await zepClient.initializeUser(testUserId, 'test@example.com', 'Test User');
    console.log('[Simple Zep Test] User initialized');
    
    // Step 3: Create a session
    await zepClient.createSession(testUserId, sessionId, 'test');
    console.log('[Simple Zep Test] Session created');
    
    // Step 4: Add a simple message
    await zepClient.addMessage(sessionId, 'user', 'Hello, I want to learn about product management');
    console.log('[Simple Zep Test] Message added');
    
    // Step 5: Get context
    const context = await zepClient.getCoachingContext(testUserId, 'Follow up question', sessionId);
    console.log('[Simple Zep Test] Context retrieved');
    
    return NextResponse.json({
      status: 'success',
      testResults: {
        connectionWorking: true,
        userInitialized: true,
        sessionCreated: true,
        messageAdded: true,
        contextRetrieved: true,
        conversationLength: context.conversationHistory.length
      },
      testData: {
        userId: testUserId,
        sessionId: sessionId,
        contextSample: {
          conversationHistory: context.conversationHistory.length,
          insights: context.insights.length,
          hasTrinity: !!context.trinity
        }
      }
    });

  } catch (error) {
    console.error('[Simple Zep Test] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    }, { status: 500 });
  }
}