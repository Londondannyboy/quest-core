import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const zepClient = new QuestZepClient();
    
    // Test 1: Get user summary with facts
    const userSummary = await zepClient.getUserSummary(userId);
    
    // Test 2: Extract facts from sample content
    const sampleContent = "I love French food and I'm planning a trip to France next summer. The cuisine in Paris is amazing!";
    const testSessionId = `test-${Date.now()}`;
    
    // Create a test session
    await zepClient.createSession(userId, testSessionId, 'test');
    
    // Add message with fact extraction
    await zepClient.addMessage(testSessionId, 'user', sampleContent, { userId });
    
    // Get updated user summary
    const updatedSummary = await zepClient.getUserSummary(userId);
    
    // Get coaching context to see if facts are retrieved
    const context = await zepClient.getCoachingContext(userId, '', testSessionId);
    
    return NextResponse.json({
      test: 'Zep improvements test',
      userId,
      beforeFacts: userSummary?.metadata?.facts || [],
      afterFacts: updatedSummary?.metadata?.facts || [],
      contextFacts: context.relevantFacts,
      trinityData: context.trinity,
      message: 'Check if French food and France are now captured'
    });
    
  } catch (error) {
    console.error('[Test Zep Improvements] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 });
  }
}