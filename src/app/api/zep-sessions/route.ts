import { NextRequest, NextResponse } from 'next/server';
import { zepClient } from '@/lib/zep-client';

export async function GET() {
  try {
    // Get recent Zep sessions for demo purposes
    // Note: This is a simplified version - in production you'd filter by actual user
    
    // For now, let's return some recent session data that we can use
    const recentSessions = [
      {
        sessionId: 'demo-session-career-transition-recent',
        userId: 'demo-user-career-transition',
        type: 'career-transition',
        lastActivity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        messageCount: 8
      },
      {
        sessionId: 'demo-session-skill-development-recent', 
        userId: 'demo-user-skill-development',
        type: 'skill-development',
        lastActivity: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        messageCount: 6
      }
    ];

    return NextResponse.json({
      status: 'success',
      recentSessions,
      mostRecentSession: recentSessions[0]
    });

  } catch (error) {
    console.error('[Zep Sessions] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch sessions'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, userId } = await request.json();
    
    if (action === 'get-latest-demo-session') {
      // Find the most recent demo session that has actual data
      const demoUsers = [
        'demo-user-career-transition',
        'demo-user-skill-development', 
        'demo-user-leadership-growth',
        'demo-user-networking-focus'
      ];
      
      // Try to get context from the most recent demo sessions
      for (const demoUserId of demoUsers) {
        try {
          // Try common session ID patterns
          const possibleSessionIds = [
            `demo-session-${demoUserId.split('-').pop()}-${Date.now()}`,
            `demo-session-${demoUserId.split('-').pop()}-recent`,
            `simple-session-${Date.now()}`,
            `simple-test-${Date.now()}`
          ];
          
          // For now, let's create a mock session with realistic data
          const mockContext = await zepClient.getCoachingContext(
            demoUserId, 
            'Getting recent context',
            undefined // No specific session, just user context
          );
          
          if (mockContext) {
            return NextResponse.json({
              status: 'success',
              sessionData: {
                sessionId: `demo-session-active`,
                userId: demoUserId,
                context: mockContext,
                isDemo: true
              }
            });
          }
        } catch (error) {
          // Continue to next user
          continue;
        }
      }
      
      // If no real data found, return enriched demo data
      return NextResponse.json({
        status: 'success',
        sessionData: {
          sessionId: 'demo-session-active',
          userId: 'demo-user-active',
          context: {
            relevantFacts: [
              "User expressed interest in transitioning from marketing to product management",
              "Mentioned 5 years experience in digital marketing campaigns",
              "Currently learning about user research and analytics"
            ],
            trinity: {
              quest: "To transition into product management and build user-centered experiences",
              service: "Creating digital products that solve real user problems", 
              pledge: "Learning one new PM skill each month and building side projects",
              confidence: 0.8,
              lastUpdated: new Date()
            },
            conversationHistory: [
              {
                role: 'user',
                content: 'I want to transition from marketing to product management',
                timestamp: new Date(Date.now() - 300000), // 5 min ago
                coach: 'career'
              },
              {
                role: 'assistant', 
                content: 'That\'s a great career move! Product management leverages many marketing skills...',
                timestamp: new Date(Date.now() - 280000),
                coach: 'career'
              },
              {
                role: 'user',
                content: 'What skills should I focus on first?',
                timestamp: new Date(Date.now() - 240000),
                coach: 'skills'
              },
              {
                role: 'assistant',
                content: 'I\'d recommend starting with user research and data analysis...',
                timestamp: new Date(Date.now() - 220000), 
                coach: 'skills'
              }
            ],
            insights: [
              "User is actively planning career transition",
              "Strong interest in skill development",
              "Values user-centered approach to products",
              "Committed to continuous learning"
            ]
          },
          isDemo: true,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('[Zep Sessions] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 500 });
  }
}