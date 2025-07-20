import { NextRequest, NextResponse } from 'next/server';
import { zepClient } from '@/lib/zep-client';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();
    
    if (!sessionId || !userId) {
      return NextResponse.json({
        error: 'Session ID and User ID are required'
      }, { status: 400 });
    }

    // Get coaching context from Zep
    const context = await zepClient.getCoachingContext(userId, 'Getting context', sessionId);
    
    // Mock relationship data for now (Zep relationship extraction would go here)
    const relationships = extractRelationshipsFromContext(context);
    const insights = extractInsightsFromContext(context);
    
    const responseData = {
      context: {
        relationships,
        insights,
        trinityEvolution: {
          quest: context.trinity?.quest,
          service: context.trinity?.service,
          pledge: context.trinity?.pledge,
          confidence: context.trinity?.confidence || 0
        },
        conversationSummary: {
          totalMessages: context.conversationHistory.length,
          keyTopics: extractKeyTopics(context.conversationHistory),
          emotionalTone: extractEmotionalTone(context.conversationHistory)
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[Zep Context] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch Zep context',
      context: {
        relationships: [],
        insights: [],
        trinityEvolution: { confidence: 0 },
        conversationSummary: {
          totalMessages: 0,
          keyTopics: [],
          emotionalTone: 'neutral'
        }
      }
    }, { status: 500 });
  }
}

function extractRelationshipsFromContext(context: any) {
  const relationships: any[] = [];
  
  // Extract relationships from conversation history
  const history = context.conversationHistory || [];
  const userMessages = history.filter((msg: any) => msg.role === 'user');
  
  userMessages.forEach((msg: any, index: number) => {
    const content = msg.content.toLowerCase();
    
    // Look for mentions of people, companies, skills
    if (content.includes('team') || content.includes('manager') || content.includes('colleague')) {
      relationships.push({
        id: `rel-${index}`,
        type: 'Professional Relationship',
        from: 'User',
        to: 'Team/Manager',
        strength: 0.8,
        context: msg.content.substring(0, 100) + '...',
        extractedAt: msg.timestamp || new Date().toISOString()
      });
    }
    
    if (content.includes('company') || content.includes('organization')) {
      relationships.push({
        id: `org-${index}`,
        type: 'Organization',
        from: 'User',
        to: 'Current Company',
        strength: 0.9,
        context: msg.content.substring(0, 100) + '...',
        extractedAt: msg.timestamp || new Date().toISOString()
      });
    }
    
    if (content.includes('skill') || content.includes('technology') || content.includes('programming')) {
      relationships.push({
        id: `skill-${index}`,
        type: 'Skill Development',
        from: 'User',
        to: 'Technical Skills',
        strength: 0.7,
        context: msg.content.substring(0, 100) + '...',
        extractedAt: msg.timestamp || new Date().toISOString()
      });
    }
  });
  
  return relationships.slice(0, 5); // Limit to top 5
}

function extractInsightsFromContext(context: any) {
  const insights: any[] = [];
  const history = context.conversationHistory || [];
  
  // Look for patterns in conversation
  const userMessages = history.filter((msg: any) => msg.role === 'user');
  const coachMessages = history.filter((msg: any) => msg.role === 'assistant');
  
  if (userMessages.length > 3) {
    insights.push({
      type: 'growth' as const,
      content: 'User is actively engaged in professional development',
      confidence: 0.9,
      timestamp: new Date().toISOString()
    });
  }
  
  const careerMentions = userMessages.filter((msg: any) => 
    msg.content.toLowerCase().includes('career') || 
    msg.content.toLowerCase().includes('job') ||
    msg.content.toLowerCase().includes('transition')
  );
  
  if (careerMentions.length > 1) {
    insights.push({
      type: 'goal' as const,
      content: 'Career transition is a primary focus area',
      confidence: 0.8,
      timestamp: new Date().toISOString()
    });
  }
  
  const skillMentions = userMessages.filter((msg: any) => 
    msg.content.toLowerCase().includes('skill') || 
    msg.content.toLowerCase().includes('learn')
  );
  
  if (skillMentions.length > 0) {
    insights.push({
      type: 'skill' as const,
      content: 'Active interest in skill development and learning',
      confidence: 0.7,
      timestamp: new Date().toISOString()
    });
  }
  
  const challengeMentions = userMessages.filter((msg: any) => 
    msg.content.toLowerCase().includes('challenge') || 
    msg.content.toLowerCase().includes('struggle') ||
    msg.content.toLowerCase().includes('difficult')
  );
  
  if (challengeMentions.length > 0) {
    insights.push({
      type: 'challenge' as const,
      content: 'User is working through specific challenges',
      confidence: 0.6,
      timestamp: new Date().toISOString()
    });
  }
  
  return insights;
}

function extractKeyTopics(conversationHistory: any[]) {
  const topics = new Set<string>();
  
  conversationHistory.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    if (content.includes('career')) topics.add('Career');
    if (content.includes('skill')) topics.add('Skills');
    if (content.includes('leadership')) topics.add('Leadership');
    if (content.includes('team')) topics.add('Team Management');
    if (content.includes('network')) topics.add('Networking');
    if (content.includes('goal')) topics.add('Goal Setting');
    if (content.includes('transition')) topics.add('Career Transition');
    if (content.includes('learning')) topics.add('Learning');
  });
  
  return Array.from(topics).slice(0, 6);
}

function extractEmotionalTone(conversationHistory: any[]) {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) return 'neutral';
  
  const lastMessages = userMessages.slice(-3);
  const combinedContent = lastMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  if (combinedContent.includes('excited') || combinedContent.includes('motivated') || combinedContent.includes('great')) {
    return 'positive';
  }
  
  if (combinedContent.includes('worried') || combinedContent.includes('concerned') || combinedContent.includes('difficult')) {
    return 'concerned';
  }
  
  if (combinedContent.includes('focused') || combinedContent.includes('planning') || combinedContent.includes('want to')) {
    return 'determined';
  }
  
  return 'engaged';
}