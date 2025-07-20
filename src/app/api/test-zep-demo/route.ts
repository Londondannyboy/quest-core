import { NextRequest, NextResponse } from 'next/server';
import { zepClient } from '@/lib/zep-client';
import { aiClient } from '@/lib/ai-client';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Zep demo endpoint - POST to run comprehensive memory test',
    scenarios: [
      'career-transition', 
      'skill-development', 
      'leadership-growth',
      'networking-focus'
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const { scenario = 'career-transition', reset = false, simple = false } = await request.json();
    
    // Simple connectivity test
    if (simple) {
      const testResult = await zepClient.testConnection();
      return NextResponse.json({
        status: 'success',
        simple: true,
        zepConnected: testResult,
        timestamp: new Date().toISOString()
      });
    }
    
    const testUserId = `demo-user-${scenario}`;
    const sessionId = `demo-session-${scenario}-${Date.now()}`;
    
    console.log('[Zep Demo] Starting scenario:', { scenario, testUserId, sessionId });

    if (reset) {
      // Clean up previous test data
      try {
        await (zepClient as any).zep.user.delete(testUserId);
        console.log('[Zep Demo] Cleaned up previous test user');
      } catch (error) {
        // User might not exist, that's fine
      }
    }

    // 1. Initialize demo user with rich context
    await zepClient.initializeUser(
      testUserId, 
      `${scenario}@questdemo.com`, 
      getDemoUserName(scenario)
    );

    // 2. Set initial Trinity based on scenario
    await zepClient.updateTrinity(testUserId, getDemoTrinity(scenario));

    // 3. Create coaching session
    await zepClient.createSession(testUserId, sessionId, 'demo-coaching');

    // 4. Simulate multi-turn conversation
    const conversation = getDemoConversation(scenario);
    let responses = [];

    for (let i = 0; i < conversation.length; i++) {
      const turn = conversation[i];
      
      // Add user message to Zep
      await zepClient.addMessage(sessionId, 'user', turn.user, {
        turnNumber: i + 1,
        scenario: scenario
      });

      // Get enhanced context from Zep
      const context = await zepClient.getCoachingContext(testUserId, turn.user, sessionId);
      
      // Generate AI response with context
      const aiResponse = await aiClient.generateResponse({
        sessionId: sessionId,
        userId: testUserId,
        coach: turn.coach as any,
        message: turn.user,
        context: {
          userName: getDemoUserName(scenario),
          hasProfile: true,
          hasTrinity: true,
          relevantMemories: context.relevantFacts,
          conversationHistory: context.conversationHistory,
          trinity: context.trinity,
          userInsights: context.insights,
          hasMemoryContext: context.relevantFacts.length > 0
        }
      });

      // Store AI response in Zep
      await zepClient.addMessage(sessionId, 'assistant', aiResponse.content, {
        coach: turn.coach,
        model: aiResponse.model,
        cost: aiResponse.cost,
        turnNumber: i + 1
      });

      responses.push({
        turn: i + 1,
        user: turn.user,
        coach: turn.coach,
        assistant: aiResponse.content,
        context: {
          relevantFacts: context.relevantFacts.length,
          conversationHistory: context.conversationHistory.length,
          hasTrinity: !!context.trinity
        },
        aiMetrics: {
          model: aiResponse.model,
          cost: aiResponse.cost,
          tokens: aiResponse.tokensUsed,
          responseTime: aiResponse.responseTime
        }
      });

      // Small delay to simulate real conversation
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Get final context to show memory accumulation
    const finalContext = await zepClient.getCoachingContext(testUserId, 'What have we discussed so far?', sessionId);

    return NextResponse.json({
      status: 'success',
      scenario: scenario,
      demoUser: {
        userId: testUserId,
        name: getDemoUserName(scenario),
        trinity: getDemoTrinity(scenario)
      },
      session: {
        sessionId: sessionId,
        turns: responses.length,
        totalCost: responses.reduce((sum, r) => sum + r.aiMetrics.cost, 0)
      },
      conversation: responses,
      memoryAccumulation: {
        relevantFacts: finalContext.relevantFacts,
        conversationHistory: finalContext.conversationHistory.length,
        insights: finalContext.insights,
        trinity: finalContext.trinity
      },
      nextSteps: [
        'Run this endpoint again with the same scenario to see memory persistence',
        'Try different scenarios to see coach specialization',
        'Check your Zep dashboard for stored conversations'
      ]
    });

  } catch (error) {
    console.error('[Zep Demo] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check that ZEP_API_KEY is properly configured in environment variables'
    }, { status: 500 });
  }
}

function getDemoUserName(scenario: string): string {
  const names = {
    'career-transition': 'Sarah Chen',
    'skill-development': 'Marcus Rodriguez',
    'leadership-growth': 'Dr. Emma Johnson',
    'networking-focus': 'Alex Thompson'
  };
  return names[scenario as keyof typeof names] || 'Demo User';
}

function getDemoTrinity(scenario: string) {
  const trinities = {
    'career-transition': {
      quest: 'To transition from marketing to product management',
      service: 'Building user-centered digital experiences',
      pledge: 'Learning one new PM skill each month',
      confidence: 0.6
    },
    'skill-development': {
      quest: 'To become a full-stack developer',
      service: 'Creating efficient, scalable applications',
      pledge: 'Contributing to open source projects weekly',
      confidence: 0.7
    },
    'leadership-growth': {
      quest: 'To lead with emotional intelligence',
      service: 'Empowering teams to reach their potential',
      pledge: 'Having meaningful 1:1s with every team member',
      confidence: 0.8
    },
    'networking-focus': {
      quest: 'To build genuine professional relationships',
      service: 'Connecting people and creating opportunities',
      pledge: 'Attending one industry event per month',
      confidence: 0.5
    }
  };
  return trinities[scenario as keyof typeof trinities] || trinities['career-transition'];
}

function getDemoConversation(scenario: string) {
  const conversations = {
    'career-transition': [
      {
        user: "I'm a marketing manager but I really want to move into product management. How do I make this transition?",
        coach: 'career'
      },
      {
        user: "I have 5 years in digital marketing and led several campaign launches. What product skills should I focus on?",
        coach: 'skills'
      },
      {
        user: "I'm worried about taking a step back in seniority. How do I position myself for a senior PM role?",
        coach: 'career'
      },
      {
        user: "Should I get a PM certification or just start building products on the side?",
        coach: 'skills'
      }
    ],
    'skill-development': [
      {
        user: "I want to become a full-stack developer but I only know frontend right now. Where should I start?",
        coach: 'skills'
      },
      {
        user: "I've been learning Node.js and databases. How do I know when I'm ready to apply for full-stack roles?",
        coach: 'career'
      },
      {
        user: "I'm building a personal project but struggling with system design. Any advice?",
        coach: 'skills'
      },
      {
        user: "How do I build a portfolio that shows I can handle both frontend and backend?",
        coach: 'career'
      }
    ],
    'leadership-growth': [
      {
        user: "I just got promoted to team lead but I've never managed people before. I'm feeling overwhelmed.",
        coach: 'leadership'
      },
      {
        user: "One of my team members seems disengaged lately. How do I approach this sensitively?",
        coach: 'leadership'
      },
      {
        user: "I want to create a culture of growth and learning. What practices should I implement?",
        coach: 'leadership'
      },
      {
        user: "How do I balance being supportive with holding people accountable?",
        coach: 'leadership'
      }
    ],
    'networking-focus': [
      {
        user: "I'm terrible at networking - it feels so fake and transactional. How do I change my mindset?",
        coach: 'network'
      },
      {
        user: "I attend events but struggle to have meaningful conversations. Any tips for introverts?",
        coach: 'network'
      },
      {
        user: "How do I follow up with people I meet without seeming pushy?",
        coach: 'network'
      },
      {
        user: "I want to give back to my network, not just take. What are some ways to add value?",
        coach: 'network'
      }
    ]
  };
  
  return conversations[scenario as keyof typeof conversations] || conversations['career-transition'];
}