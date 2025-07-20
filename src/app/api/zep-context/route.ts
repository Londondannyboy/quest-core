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
  
  // Extract CONTEXTUAL relationships from conversation history (Zep specialty)
  const history = context.conversationHistory || [];
  const userMessages = history.filter((msg: any) => msg.role === 'user');
  
  userMessages.forEach((msg: any, index: number) => {
    const content = msg.content.toLowerCase();
    const originalContent = msg.content;
    
    // Zep-style contextual relationship extraction patterns
    
    // 1. Interest → Goal Connections
    const interestGoalPatterns = [
      { 
        interest: /(?:love|enjoy|passionate about|interested in)\s+([\w\s]+)/i, 
        goal: /(?:want to|hoping to|planning to)\s+([\w\s]+)/i,
        connection: 'drives'
      },
      {
        interest: /(?:travel|traveling|explore|exploring)\s*(?:to)?\s*([\w\s]*)/i,
        goal: /(?:remote work|flexibility|location independence|work from anywhere)/i,
        connection: 'enables'
      }
    ];
    
    interestGoalPatterns.forEach((pattern) => {
      const interestMatch = originalContent.match(pattern.interest);
      const goalMatch = originalContent.match(pattern.goal);
      
      if (interestMatch && goalMatch) {
        const interest = interestMatch[1]?.trim() || 'personal interest';
        const goal = goalMatch[1]?.trim() || 'career goal';
        
        relationships.push({
          id: `connection-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Contextual Connection',
          from: interest,
          to: goal,
          strength: 0.85,
          context: `Interest in ${interest} ${pattern.connection} goal of ${goal}`,
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'connection',
          connectionType: pattern.connection
        });
      }
    });
    
    // 2. Value → Decision Connections
    const valueDecisionPatterns = [
      {
        value: /(?:value|important to me|care about)\s+([\w\s]+)/i,
        decision: /(?:chose|decided|picked|selected)\s+([\w\s]+)/i,
        connection: 'influences'
      },
      {
        value: /(?:work-life balance|flexibility|autonomy)/i,
        decision: /(?:freelance|remote|startup|leave)/i,
        connection: 'motivates'
      }
    ];
    
    valueDecisionPatterns.forEach((pattern) => {
      const valueMatch = originalContent.match(pattern.value);
      const decisionMatch = originalContent.match(pattern.decision);
      
      if (valueMatch && decisionMatch) {
        const value = valueMatch[1]?.trim() || valueMatch[0];
        const decision = decisionMatch[1]?.trim() || decisionMatch[0];
        
        relationships.push({
          id: `value-decision-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Value-Decision Link',
          from: value,
          to: decision,
          strength: 0.9,
          context: `Value of ${value} ${pattern.connection} decision about ${decision}`,
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'value',
          connectionType: pattern.connection
        });
      }
    });
    
    // 3. Challenge → Solution Connections
    const challengeSolutionPatterns = [
      {
        challenge: /(?:struggle with|difficult|problem|challenge)\s+([\w\s]+)/i,
        solution: /(?:need to|should|going to|plan to)\s+([\w\s]+)/i,
        connection: 'requires'
      },
      {
        challenge: /(?:time management|work-life balance|stress)/i,
        solution: /(?:delegate|prioritize|boundaries|schedule)/i,
        connection: 'addressed by'
      }
    ];
    
    challengeSolutionPatterns.forEach((pattern) => {
      const challengeMatch = originalContent.match(pattern.challenge);
      const solutionMatch = originalContent.match(pattern.solution);
      
      if (challengeMatch && solutionMatch) {
        const challenge = challengeMatch[1]?.trim() || challengeMatch[0];
        const solution = solutionMatch[1]?.trim() || solutionMatch[0];
        
        relationships.push({
          id: `challenge-solution-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Challenge-Solution Path',
          from: challenge,
          to: solution,
          strength: 0.8,
          context: `Challenge with ${challenge} ${pattern.connection} ${solution}`,
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'solution',
          connectionType: pattern.connection
        });
      }
    });
    
    // 4. Experience → Insight Connections
    const experienceInsightPatterns = [
      {
        experience: /(?:when I|experience|time I)\s+([\w\s]+)/i,
        insight: /(?:learned|realized|discovered|understood)\s+([\w\s]+)/i,
        connection: 'taught me'
      },
      {
        experience: /(?:project|role|job|position)\s+([\w\s]*)/i,
        insight: /(?:good at|strength|excel at|skilled in)\s+([\w\s]+)/i,
        connection: 'revealed'
      }
    ];
    
    experienceInsightPatterns.forEach((pattern) => {
      const experienceMatch = originalContent.match(pattern.experience);
      const insightMatch = originalContent.match(pattern.insight);
      
      if (experienceMatch && insightMatch) {
        const experience = experienceMatch[1]?.trim() || experienceMatch[0];
        const insight = insightMatch[1]?.trim() || insightMatch[0];
        
        relationships.push({
          id: `experience-insight-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Experience-Insight Map',
          from: experience,
          to: insight,
          strength: 0.75,
          context: `Experience with ${experience} ${pattern.connection} that ${insight}`,
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'insight',
          connectionType: pattern.connection
        });
      }
    });
    
    // 5. Topic → Topic Semantic Connections
    const topicConnections = [
      { topics: ['travel', 'remote work'], connection: 'enables', strength: 0.9 },
      { topics: ['leadership', 'management'], connection: 'includes', strength: 0.8 },
      { topics: ['coding', 'problem solving'], connection: 'requires', strength: 0.7 },
      { topics: ['networking', 'career growth'], connection: 'supports', strength: 0.8 },
      { topics: ['learning', 'skill development'], connection: 'facilitates', strength: 0.9 }
    ];
    
    topicConnections.forEach((conn) => {
      const [topic1, topic2] = conn.topics;
      if (content.includes(topic1) && content.includes(topic2)) {
        relationships.push({
          id: `topic-connection-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Semantic Connection',
          from: topic1,
          to: topic2,
          strength: conn.strength,
          context: `Discussion connects ${topic1} and ${topic2}`,
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'semantic',
          connectionType: conn.connection
        });
      }
    });
  });
  
  // Remove duplicates and sort by strength
  const uniqueRelationships = relationships.filter((rel, index, self) => 
    index === self.findIndex(r => r.from === rel.from && r.to === rel.to && r.type === rel.type)
  );
  
  return uniqueRelationships
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
}

function calculateRelationshipStrength(content: string, entity: string): number {
  const positiveWords = ['great', 'excellent', 'amazing', 'supportive', 'helpful', 'mentor'];
  const negativeWords = ['difficult', 'challenging', 'problematic', 'toxic'];
  const neutralWords = ['working', 'collaborate', 'team', 'together'];
  
  const lowerContent = content.toLowerCase();
  
  let score = 0.6; // Base strength
  
  positiveWords.forEach(word => {
    if (lowerContent.includes(word)) score += 0.15;
  });
  
  negativeWords.forEach(word => {
    if (lowerContent.includes(word)) score -= 0.2;
  });
  
  neutralWords.forEach(word => {
    if (lowerContent.includes(word)) score += 0.05;
  });
  
  return Math.min(Math.max(score, 0.1), 1.0);
}

function calculateSkillStrength(content: string, skill: string): number {
  const expertWords = ['expert', 'proficient', 'experienced', 'advanced'];
  const learningWords = ['learning', 'studying', 'beginner', 'new to'];
  
  const lowerContent = content.toLowerCase();
  
  if (expertWords.some(word => lowerContent.includes(word))) return 0.9;
  if (learningWords.some(word => lowerContent.includes(word))) return 0.4;
  
  return 0.6; // Default intermediate level
}

function extractRelevantContext(content: string, match: string): string {
  const sentences = content.split(/[.!?]/);
  const relevantSentence = sentences.find(sentence => sentence.includes(match));
  return relevantSentence ? relevantSentence.trim() : content.substring(0, 120) + '...';
}

function extractSentiment(content: string, context: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['love', 'enjoy', 'excited', 'great', 'excellent', 'amazing'];
  const negativeWords = ['hate', 'dislike', 'struggle', 'difficult', 'challenging', 'frustrated'];
  
  const contextLower = context.toLowerCase();
  
  if (positiveWords.some(word => contextLower.includes(word))) return 'positive';
  if (negativeWords.some(word => contextLower.includes(word))) return 'negative';
  
  return 'neutral';
}

function extractProficiencyLevel(content: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('expert') || lowerContent.includes('proficient')) return 'expert';
  if (lowerContent.includes('advanced') || lowerContent.includes('experienced')) return 'advanced';
  if (lowerContent.includes('beginner') || lowerContent.includes('new to')) return 'beginner';
  
  return 'intermediate';
}

function extractTimeframe(content: string): string {
  const timeframes = [
    { pattern: /(\d+)\s+(month|year)s?/i, format: (match: RegExpMatchArray) => `${match[1]} ${match[2]}s` },
    { pattern: /(short|long)\s+term/i, format: (match: RegExpMatchArray) => `${match[1]} term` },
    { pattern: /(soon|immediately|asap)/i, format: () => 'immediate' },
    { pattern: /(eventually|someday|future)/i, format: () => 'long term' }
  ];
  
  for (const timeframe of timeframes) {
    const match = content.match(timeframe.pattern);
    if (match) return timeframe.format(match);
  }
  
  return 'unspecified';
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