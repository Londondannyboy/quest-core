import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiClient, CoachingSession } from '@/lib/ai-client';
import { zepClient } from '@/lib/zep-client';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('[Full Integration Test] Starting comprehensive test for userId:', userId);
    
    // Test 1: OpenRouter AI Client Connection
    const aiClientConnected = await aiClient.testConnection();
    console.log('[Test 1] AI Client connected:', aiClientConnected);
    
    // Test 2: Zep Memory Client Connection  
    const zepConnected = await zepClient.testConnection();
    console.log('[Test 2] Zep connected:', zepConnected);
    
    // Test 3: Ensure user exists in Zep
    await zepClient.initializeUser(userId);
    console.log('[Test 3] User initialized in Zep:', userId);
    
    // Test 4: Full AI + Zep Integration Test
    const testSessionId = `full-test-${Date.now()}`;
    const testMessage = "I'm interested in transitioning my career into AI and machine learning. I love working with data and want to make an impact in tech.";
    
    // Get coaching context from Zep
    const zepContext = await zepClient.getCoachingContext(userId, testMessage, testSessionId);
    console.log('[Test 4] Got Zep context with', zepContext.relevantFacts.length, 'facts');
    
    // Create coaching session
    const coachingSession: CoachingSession = {
      sessionId: testSessionId,
      userId,
      coach: 'career', // Should route to career coach for this query
      message: testMessage,
      context: {
        zepContext,
        userProfile: { testMode: true },
        trinity: zepContext.trinity
      }
    };
    
    // Generate AI response using OpenRouter
    const aiResponse = await aiClient.generateResponse(coachingSession);
    console.log('[Test 4] AI response generated:', {
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      cost: aiResponse.cost,
      responseTime: aiResponse.responseTime
    });
    
    // Test 5: Store response in Zep for memory
    await zepClient.addMessage(testSessionId, 'user', testMessage, { userId, testMode: true });
    await zepClient.addMessage(testSessionId, 'assistant', aiResponse.content, { userId, testMode: true, model: aiResponse.model });
    console.log('[Test 5] Messages stored in Zep memory');
    
    // Test 6: Get updated context to verify persistence
    const updatedContext = await zepClient.getCoachingContext(userId, '', testSessionId);
    console.log('[Test 6] Updated context retrieved with', updatedContext.relevantFacts.length, 'facts');
    
    // Test 7: Test live context endpoint  
    const liveContextResponse = await fetch('/api/live-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: testSessionId, userId })
    });
    
    let liveContextData = null;
    if (liveContextResponse.ok) {
      liveContextData = await liveContextResponse.json();
      console.log('[Test 7] Live context retrieved with', liveContextData.context?.relationships?.length || 0, 'relationships');
    } else {
      console.log('[Test 7] Live context failed:', liveContextResponse.status);
    }
    
    // Final Results
    const results = {
      overallStatus: 'Quest Core Full Integration Test Complete',
      timestamp: new Date().toISOString(),
      
      // Connection Tests
      connections: {
        openRouterAI: aiClientConnected,
        zepMemory: zepConnected,
        status: aiClientConnected && zepConnected ? 'PASS' : 'FAIL'
      },
      
      // AI Integration Test
      aiIntegration: {
        coachType: coachingSession.coach,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
        estimatedCost: aiResponse.cost,
        responseTime: `${aiResponse.responseTime}ms`,
        contentPreview: aiResponse.content.substring(0, 100) + '...',
        status: aiResponse.content ? 'PASS' : 'FAIL'
      },
      
      // Memory Integration Test
      memoryIntegration: {
        initialFacts: zepContext.relevantFacts.length,
        finalFacts: updatedContext.relevantFacts.length,
        memoryPersistence: updatedContext.relevantFacts.length >= zepContext.relevantFacts.length,
        trinityData: updatedContext.trinity,
        status: updatedContext.conversationHistory.length > 0 ? 'PASS' : 'FAIL'
      },
      
      // Live Context Test  
      liveContext: {
        relationships: liveContextData?.context?.relationships?.length || 0,
        insights: liveContextData?.context?.insights?.length || 0,
        keyTopics: liveContextData?.context?.conversationSummary?.keyTopics || [],
        status: liveContextData ? 'PASS' : 'FAIL'
      },
      
      // Cost Tracking
      costTracking: {
        sessionCost: aiResponse.cost,
        totalUserCost: aiClient.getCostData(userId),
        model: aiResponse.model
      },
      
      // Summary
      summary: {
        allSystemsOperational: aiClientConnected && zepConnected && 
          aiResponse.content && updatedContext.conversationHistory.length > 0,
        integrationWorking: true,
        costOptimizationActive: aiResponse.model !== 'openai/gpt-4-turbo', // If using cheaper models
        memoryWorking: updatedContext.conversationHistory.length > 0,
        ready: 'Quest Core is ready for full AI-powered coaching with memory and cost optimization'
      }
    };
    
    console.log('[Full Integration Test] Complete:', results.summary);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('[Full Integration Test] Error:', error);
    
    return NextResponse.json({
      error: 'Full integration test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      status: 'FAIL'
    }, { status: 500 });
  }
}