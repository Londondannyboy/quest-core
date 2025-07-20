import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    console.log('[Zep Test] Testing Zep connection for user:', userId);
    
    // Test Zep client initialization
    const zepClient = new QuestZepClient();
    
    // Test user initialization
    await zepClient.initializeUser(userId, 'test@example.com', 'Test User');
    console.log('[Zep Test] User initialized successfully');
    
    // Test session creation
    const testSessionId = `test-session-${Date.now()}`;
    await zepClient.createSession(userId, testSessionId, 'voice_coaching');
    console.log('[Zep Test] Session created successfully');
    
    // Test message addition
    await zepClient.addMessage(testSessionId, 'user', 'I love football and want to visit Spain');
    console.log('[Zep Test] Message added successfully');
    
    await zepClient.addMessage(testSessionId, 'assistant', 'That sounds exciting! Football is popular in Spain. What draws you to Spanish football culture?');
    console.log('[Zep Test] Assistant message added successfully');
    
    // Test context retrieval
    const context = await zepClient.getCoachingContext(userId, 'Tell me more about your interests', testSessionId);
    console.log('[Zep Test] Context retrieved:', {
      relevantFactsCount: context.relevantFacts.length,
      conversationHistoryCount: context.conversationHistory.length,
      trinity: context.trinity
    });
    
    return NextResponse.json({
      success: true,
      testSessionId,
      results: {
        userInitialized: true,
        sessionCreated: true,
        messagesAdded: 2,
        contextRetrieved: true,
        relevantFacts: context.relevantFacts,
        conversationHistory: context.conversationHistory.length,
        trinity: context.trinity
      }
    });
    
  } catch (error) {
    console.error('[Zep Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}