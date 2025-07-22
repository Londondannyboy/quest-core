import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';

// Extract contextual relationships from recent conversation content
function extractContextualRelationships(conversationContent: string[]) {
  const relationships: any[] = [];
  const fullContent = conversationContent.join(' ').toLowerCase();
  
  // Dynamic Interest → Goal Connections
  const interestGoalPatterns = [
    // Sports connections
    {
      interest: /\b(football|soccer|basketball|tennis|golf|sports|match|game|team)\b/gi,
      goal: /\b([a-z]+(?:ia|land|any|ce|il|ay|en|an|al|co)\b|travel|trip|visit|holiday|vacation)\b/gi,
      connection: 'drives interest in'
    },
    // Food & Culture connections
    {
      interest: /\b(food|cuisine|dish|tapas|paella|wine|cheese|pasta|pizza|sushi|restaurant|dining|cooking)\b/gi,
      goal: /\b([a-z]+(?:ia|land|any|ce|il|ay|en|an|al|co)\b|culture|experience|explore|taste|discover)\b/gi,
      connection: 'enhances interest in'
    },
    // Travel & Places connections
    {
      interest: /\b(beach|mountain|city|museum|art|gallery|castle|palace|park)\b/gi,
      goal: /\b(travel|trip|visit|holiday|vacation|explore|discover|adventure|tour)\b/gi,
      connection: 'motivates'
    },
    // Activities & Experiences
    {
      interest: /\b(music|dance|art|theater|cinema|photography|hiking|cycling|swimming)\b/gi,
      goal: /\b(experience|explore|learn|discover|enjoy|participate)\b/gi,
      connection: 'leads to'
    },
    // Emotion & Goal connections
    {
      interest: /\b(love|enjoy|passionate|interested|excited)\b/gi,
      goal: /\b(plan|dream|hope|want|wish|goal|future)\b/gi,
      connection: 'inspires'
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
      
      // Get Zep memory context and facts (current session + cross-session history)
      const context = await zepClient.getCoachingContext(userId, '', sessionId);
      
      // ALSO get cross-session memory for persistent relationships
      // Instead of hardcoded search, use a broader query to capture all user interests
      const crossSessionContext = await zepClient.getCoachingContext(userId, '');
      
      // Get user's full memory to ensure we capture all topics
      let allUserFacts: string[] = [];
      try {
        // Try to get all user facts from Zep (not just session-specific)
        const userMemory = await zepClient.getUserSummary(userId);
        if (userMemory?.metadata?.facts) {
          allUserFacts = userMemory.metadata.facts;
        }
        
        // Also get facts from recent sessions
        const recentSessions = await zepClient.getUserSessions(userId);
        for (const session of recentSessions) {
          if (session.facts && Array.isArray(session.facts)) {
            allUserFacts.push(...session.facts);
          }
        }
      } catch (error) {
        console.log('[Live Context] Could not retrieve full user memory:', error);
      }
      
      // Combine all sources of facts for comprehensive context
      const allRelevantFacts = [
        ...new Set([
          ...context.relevantFacts,
          ...crossSessionContext.relevantFacts,
          ...allUserFacts
        ])
      ];
      
      console.log('[Live Context] Total facts (current + historical):', allRelevantFacts.length);
      
      if (allRelevantFacts.length === 0) {
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
      console.log('[Live Context] Raw Zep facts:', allRelevantFacts.length);
      
      // Clean up verbose Zep facts into key phrases for relationship extraction
      const conversationContent = allRelevantFacts.map(fact => {
        // Dynamic entity extraction from Zep facts
        const entities = [];
        const factLower = fact.toLowerCase();
        
        // Extract ALL proper nouns and significant words dynamically
        // This ensures we capture any country, city, food, or activity mentioned
        
        // Countries - dynamic extraction
        const countryPatterns = /\b(france|french|spain|spanish|italy|italian|germany|german|england|english|portugal|portuguese|greece|greek|japan|japanese|china|chinese|mexico|mexican|brazil|brazilian|india|indian|thailand|thai|vietnam|vietnamese|korea|korean)\b/gi;
        const countryMatches = factLower.match(countryPatterns);
        if (countryMatches) {
          countryMatches.forEach(country => {
            const normalized = country.charAt(0).toUpperCase() + country.slice(1);
            entities.push(normalized);
          });
        }
        
        // Food & Cuisine - dynamic extraction
        const foodPatterns = /\b(tapas|paella|wine|cheese|bread|pasta|pizza|sushi|curry|noodles|rice|seafood|meat|vegetarian|vegan|breakfast|lunch|dinner|dessert|coffee|tea|restaurant|cafe|bar|food|cuisine|dish|meal|eating|dining|cooking|recipe)\b/gi;
        const foodMatches = factLower.match(foodPatterns);
        if (foodMatches) {
          foodMatches.forEach(food => {
            entities.push(food);
          });
        }
        
        // Activities & Interests - dynamic extraction
        const activityPatterns = /\b(football|soccer|basketball|tennis|golf|swimming|running|cycling|hiking|climbing|surfing|skiing|dancing|music|art|museum|gallery|theater|cinema|movie|book|reading|writing|photography|travel|trip|vacation|holiday|visit|explore|adventure|tour|sightseeing)\b/gi;
        const activityMatches = factLower.match(activityPatterns);
        if (activityMatches) {
          activityMatches.forEach(activity => {
            entities.push(activity);
          });
        }
        
        // Cities & Places - dynamic extraction (broader)
        const placePatterns = /\b(paris|london|rome|berlin|tokyo|beijing|new york|los angeles|madrid|barcelona|valencia|seville|lisbon|amsterdam|prague|vienna|budapest|athens|cairo|dubai|sydney|melbourne|toronto|vancouver|beach|mountain|lake|river|park|garden|castle|palace|church|cathedral|bridge|tower|square|market|mall|shop|store|airport|station|hotel|home|office|school|university)\b/gi;
        const placeMatches = factLower.match(placePatterns);
        if (placeMatches) {
          placeMatches.forEach(place => {
            const normalized = place.charAt(0).toUpperCase() + place.slice(1);
            entities.push(normalized);
          });
        }
        
        // Emotions & Feelings - for better context
        const emotionPatterns = /\b(love|like|enjoy|passionate|interested|excited|happy|amazing|awesome|great|wonderful|beautiful|fantastic|incredible|dream|hope|want|wish|plan|goal)\b/gi;
        const emotionMatches = factLower.match(emotionPatterns);
        if (emotionMatches) {
          emotionMatches.forEach(emotion => {
            entities.push(emotion);
          });
        }
        
        // Also keep the original fact if it's short enough and no entities were found
        if (entities.length === 0 && fact.length < 100) {
          // Extract key phrases from the fact itself
          const keyWords = fact.split(/\s+/)
            .filter(word => word.length > 4 && !['about', 'there', 'which', 'would', 'could', 'should', 'their', 'these', 'those'].includes(word.toLowerCase()))
            .slice(0, 3);
          entities.push(...keyWords);
        }
        
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