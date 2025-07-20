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
    const originalContent = msg.content;
    
    // Enhanced relationship extraction patterns
    
    // 1. Professional Relationships (People)
    const peoplePatterns = [
      { pattern: /(?:my|the|our)\s+(manager|boss|supervisor)/i, entity: 'Manager' },
      { pattern: /(?:my|the|our)\s+(team|teammates|colleagues)/i, entity: 'Team Members' },
      { pattern: /(?:working with|collaborated with|partner)\s+([A-Z][a-z]+)/i, entity: 'Collaborator' },
      { pattern: /(?:mentor|coach|advisor)\s+([A-Z][a-z]+)?/i, entity: 'Mentor' },
      { pattern: /(?:client|customer)\s+([A-Z][a-z]+)?/i, entity: 'Client' }
    ];
    
    peoplePatterns.forEach((pattern) => {
      const match = originalContent.match(pattern.pattern);
      if (match) {
        const entityName = match[1] || pattern.entity;
        relationships.push({
          id: `person-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Professional Relationship',
          from: 'User',
          to: entityName.charAt(0).toUpperCase() + entityName.slice(1),
          strength: calculateRelationshipStrength(originalContent, pattern.entity),
          context: extractRelevantContext(originalContent, match[0]),
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'person',
          sentiment: extractSentiment(originalContent, match[0])
        });
      }
    });
    
    // 2. Organization Relationships
    const orgPatterns = [
      { pattern: /(?:at|work at|employed by)\s+([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Ltd)?)/i, entity: 'Current Company' },
      { pattern: /(?:previous|former|used to work at)\s+([A-Z][A-Za-z\s&]+)/i, entity: 'Previous Company' },
      { pattern: /(?:startup|company|organization)\s+([A-Z][A-Za-z\s&]+)/i, entity: 'Organization' },
      { pattern: /(?:university|college|school)\s+([A-Z][A-Za-z\s&]+)/i, entity: 'Educational Institution' }
    ];
    
    orgPatterns.forEach((pattern) => {
      const match = originalContent.match(pattern.pattern);
      if (match) {
        relationships.push({
          id: `org-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Organization',
          from: 'User',
          to: match[1].trim(),
          strength: 0.9,
          context: extractRelevantContext(originalContent, match[0]),
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'organization',
          sentiment: extractSentiment(originalContent, match[0])
        });
      }
    });
    
    // 3. Skill & Technology Relationships
    const skillPatterns = [
      { pattern: /(?:learning|studying|mastering)\s+([\w\s-]+(?:programming|development|management|design|analytics))/i, entity: 'Learning Skill' },
      { pattern: /(?:expert in|skilled at|experienced with)\s+([\w\s-]+)/i, entity: 'Expert Skill' },
      { pattern: /(?:want to learn|interested in)\s+([\w\s-]+)/i, entity: 'Target Skill' },
      { pattern: /(?:python|javascript|react|node|sql|aws|docker|kubernetes)/i, entity: 'Technical Skill' }
    ];
    
    skillPatterns.forEach((pattern) => {
      const match = originalContent.match(pattern.pattern);
      if (match) {
        const skillName = match[1] || match[0];
        relationships.push({
          id: `skill-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Skill Development',
          from: 'User',
          to: skillName.trim(),
          strength: calculateSkillStrength(originalContent, skillName),
          context: extractRelevantContext(originalContent, match[0]),
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'skill',
          proficiencyLevel: extractProficiencyLevel(originalContent),
          sentiment: extractSentiment(originalContent, match[0])
        });
      }
    });
    
    // 4. Goal & Aspiration Relationships
    const goalPatterns = [
      { pattern: /(?:want to|goal is to|hoping to)\s+([\w\s]+)/i, entity: 'Career Goal' },
      { pattern: /(?:transition to|move into|become)\s+([\w\s]+)/i, entity: 'Career Transition' },
      { pattern: /(?:improve|develop|build)\s+([\w\s]+(?:skills|abilities|knowledge))/i, entity: 'Development Goal' }
    ];
    
    goalPatterns.forEach((pattern) => {
      const match = originalContent.match(pattern.pattern);
      if (match) {
        relationships.push({
          id: `goal-${index}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'Career Aspiration',
          from: 'User',
          to: match[1].trim(),
          strength: 0.8,
          context: extractRelevantContext(originalContent, match[0]),
          extractedAt: msg.timestamp || new Date().toISOString(),
          category: 'goal',
          timeframe: extractTimeframe(originalContent),
          sentiment: 'positive'
        });
      }
    });
  });
  
  // Remove duplicates and sort by strength
  const uniqueRelationships = relationships.filter((rel, index, self) => 
    index === self.findIndex(r => r.to === rel.to && r.type === rel.type)
  );
  
  return uniqueRelationships
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8); // Increased limit for richer visualization
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