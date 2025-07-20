import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';

// Extract contextual relationships from recent conversation content
function extractContextualRelationships(conversationContent: string[]) {
  const relationships: any[] = [];
  const fullContent = conversationContent.join(' ').toLowerCase();
  
  // Interest → Goal Connections (optimized for Zep facts)
  const interestGoalPatterns = [
    {
      interest: /\b(football|soccer|sports)\b/gi,
      goal: /\b(spain|spanish|holiday.*spain|travel.*spain)\b/gi,
      connection: 'drives interest in'
    },
    {
      interest: /\bfootball\b/gi,
      goal: /\b(holiday planning|travel planning)\b/gi,
      connection: 'motivates'
    },
    {
      interest: /\b(football matches|la liga)\b/gi,
      goal: /\b(spain|spanish culture)\b/gi,
      connection: 'connects to'
    },
    {
      interest: /\bspanish culture\b/gi,
      goal: /\b(holiday planning|travel planning)\b/gi,
      connection: 'influences'
    },
    {
      interest: /\b(tapas|spanish cuisine)\b/gi,
      goal: /\b(spain|holiday planning|dining experiences)\b/gi,
      connection: 'enhances interest in'
    },
    {
      interest: /\b(beaches|coastal experiences)\b/gi,
      goal: /\b(spain|holiday planning|beach activities)\b/gi,
      connection: 'motivates visit to'
    }
  ];
  
  interestGoalPatterns.forEach((pattern, index) => {
    const interestMatches = Array.from(fullContent.matchAll(pattern.interest));
    const goalMatches = Array.from(fullContent.matchAll(pattern.goal));
    
    if (interestMatches.length > 0 && goalMatches.length > 0) {
      const interest = interestMatches[0][1] || interestMatches[0][0];
      const goal = goalMatches[0][1] || goalMatches[0][0];
      
      relationships.push({
        id: `interest-goal-${index}-${Date.now()}`,
        type: 'Interest-Goal Connection',
        from: interest,
        to: goal,
        strength: 0.85,
        context: `Interest in ${interest} ${pattern.connection} goal of ${goal}`,
        extractedAt: new Date().toISOString(),
        category: 'connection',
        connectionType: pattern.connection
      });
    }
  });
  
  // Sports → Culture Connections
  const sportsPatterns = [
    {
      sport: /(?:football|soccer|sports)/gi,
      culture: /(?:spain|spanish|madrid|barcelona|la liga)/gi,
      connection: 'connects to'
    },
    {
      sport: /(?:tapas|spanish cuisine|dining experiences)/gi,
      culture: /(?:spain|spanish culture|holiday planning)/gi,
      connection: 'enriches experience of'
    },
    {
      sport: /(?:beaches|coastal experiences|beach activities)/gi,
      culture: /(?:spain|spanish|holiday planning|mediterranean)/gi,
      connection: 'complements'
    }
  ];
  
  sportsPatterns.forEach((pattern, index) => {
    const sportMatches = Array.from(fullContent.matchAll(pattern.sport));
    const cultureMatches = Array.from(fullContent.matchAll(pattern.culture));
    
    if (sportMatches.length > 0 && cultureMatches.length > 0) {
      const sport = sportMatches[0][0];
      const culture = cultureMatches[0][0];
      
      relationships.push({
        id: `sport-culture-${index}-${Date.now()}`,
        type: 'Cultural Connection',
        from: sport,
        to: culture,
        strength: 0.8,
        context: `Interest in ${sport} ${pattern.connection} ${culture} culture`,
        extractedAt: new Date().toISOString(),
        category: 'semantic',
        connectionType: pattern.connection
      });
    }
  });
  
  // Topic Frequency Analysis  
  const topics = {
    'football': /football|soccer|sports|team|match|awesome|way/gi,
    'spain': /spain|spanish|madrid|barcelona/gi,
    'holiday': /holiday|vacation|trip|visit|travel|traveling/gi,
    'love': /love|enjoy|passionate|awesome|amazing|great/gi,
    'plans': /planning|want to|going to|dream of|hoping to/gi
  };
  
  const topicCounts: Record<string, number> = {};
  Object.entries(topics).forEach(([topic, pattern]) => {
    const matches = Array.from(fullContent.matchAll(pattern));
    topicCounts[topic] = matches.length;
  });
  
  // Create topic connections based on co-occurrence
  const sortedTopics = Object.entries(topicCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);
  
  for (let i = 0; i < sortedTopics.length - 1; i++) {
    for (let j = i + 1; j < sortedTopics.length; j++) {
      const [topic1, count1] = sortedTopics[i];
      const [topic2, count2] = sortedTopics[j];
      
      if (count1 > 0 && count2 > 0) {
        relationships.push({
          id: `topic-${topic1}-${topic2}-${Date.now()}`,
          type: 'Topic Association',
          from: topic1,
          to: topic2,
          strength: Math.min(0.9, (count1 + count2) / 10),
          context: `Discussion frequently mentions both ${topic1} and ${topic2}`,
          extractedAt: new Date().toISOString(),
          category: 'semantic',
          connectionType: 'co-occurs with'
        });
      }
    }
  }
  
  return relationships.slice(0, 8); // Limit to top 8 relationships
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    console.log('[Live Context] Request for session:', sessionId);
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      console.log('[Live Context] No authenticated user');
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    console.log('[Live Context] Authenticated user:', userId);
    
    // Initialize Zep client and get conversation data
    const zepClient = new QuestZepClient();
    
    try {
      // Ensure user exists in Zep
      await zepClient.initializeUser(userId);
      
      // Get Zep memory context and facts
      const context = await zepClient.getCoachingContext(userId, '', sessionId);
      
      if (!context || context.relevantFacts.length === 0) {
        // No conversation data in Zep yet
        return NextResponse.json({
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
        });
      }
      
      // Extract conversation content from Zep facts for relationship analysis
      console.log('[Live Context] Raw Zep facts:', context.relevantFacts.length);
      
      // Clean up verbose Zep facts into key phrases for relationship extraction
      const conversationContent = context.relevantFacts.map(fact => {
        // Dynamic entity extraction from Zep facts
        const entities = [];
        const factLower = fact.toLowerCase();
        
        // Core topics (existing)
        if (factLower.includes('football')) entities.push('football');
        if (factLower.includes('spain') || factLower.includes('spanish')) entities.push('Spain');
        if (factLower.includes('holiday') || factLower.includes('visit')) entities.push('holiday planning');
        if (factLower.includes('la liga') || factLower.includes('matches')) entities.push('football matches');
        if (factLower.includes('culture')) entities.push('Spanish culture');
        if (factLower.includes('cities')) entities.push('travel planning');
        
        // Food & Dining (NEW)
        if (factLower.includes('tapas')) entities.push('tapas');
        if (factLower.includes('food') || factLower.includes('cuisine') || factLower.includes('dining')) entities.push('Spanish cuisine');
        if (factLower.includes('restaurant') || factLower.includes('eating')) entities.push('dining experiences');
        
        // Beach & Leisure (NEW)
        if (factLower.includes('beach') || factLower.includes('beaches')) entities.push('beaches');
        if (factLower.includes('coast') || factLower.includes('mediterranean')) entities.push('coastal experiences');
        if (factLower.includes('sun') || factLower.includes('swimming')) entities.push('beach activities');
        
        // Activities & Experiences (NEW)
        if (factLower.includes('museum') || factLower.includes('art')) entities.push('cultural activities');
        if (factLower.includes('bar') || factLower.includes('nightlife')) entities.push('nightlife');
        if (factLower.includes('walk') || factLower.includes('explore')) entities.push('exploration');
        
        return entities.join(' ');
      }).filter(Boolean);
      
      console.log('[Live Context] Cleaned content for analysis:', conversationContent);
    
      // Extract contextual relationships from Zep facts
      const relationships = extractContextualRelationships(conversationContent);
      
      // Use Zep's Trinity insights if available
      const trinityData = context.trinity || { confidence: 0 };
      
      // Generate insights from Zep context
      const insights: Array<{type: string, content: string, confidence: number, timestamp: string}> = [];
      
      for (const insight of context.insights || []) {
        if (typeof insight === 'string') {
          insights.push({
            type: 'general',
            content: insight,
            confidence: 0.8,
            timestamp: new Date().toISOString()
          });
        } else {
          insights.push({
            type: (insight as any).type || 'general',
            content: (insight as any).content || String(insight),
            confidence: (insight as any).confidence || 0.8,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      if (relationships.some(r => r.category === 'connection')) {
        insights.push({
          type: 'goal',
          content: 'Personal interests are connecting to life goals',
          confidence: 0.8,
          timestamp: new Date().toISOString()
        });
      }
      
      // Extract key topics from Zep facts and relationships
      const keyTopics = [...new Set([
        ...relationships.flatMap(r => [r.from, r.to]),
        ...context.relevantFacts.slice(0, 3)
      ])].map(topic => topic.charAt(0).toUpperCase() + topic.slice(1)).slice(0, 5);
      
      return NextResponse.json({
        context: {
          relationships,
          insights,
          trinityEvolution: {
            quest: trinityData.quest || (relationships.length > 0 ? 'Exploring interests and goals' : undefined),
            service: trinityData.service || (relationships.length > 0 ? 'Sharing personal passions' : undefined),
            pledge: trinityData.pledge || (relationships.length > 0 ? 'Following through on interests' : undefined),
            confidence: trinityData.confidence || (relationships.length > 0 ? 0.6 : 0)
          },
          conversationSummary: {
            totalMessages: context.conversationHistory.length,
            keyTopics,
            emotionalTone: 'engaged'
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (zepError) {
      console.error('[Live Context] Zep error:', zepError);
      
      // Return empty state if Zep fails
      return NextResponse.json({
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
      });
    }
    
  } catch (error) {
    console.error('[Live Context] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch live context'
    }, { status: 500 });
  }
}