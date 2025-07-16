import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ConversationParser } from '@/lib/conversation-parser';

// POST - Extract conversation data and create commits
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { 
      conversationText, 
      batchId, 
      conversationId, 
      extractionMode = 'auto', // auto, manual, specific
      targetTypes = [] // specific types to extract if mode is 'specific'
    } = body;

    console.log(`Extracting conversation data for user ${user.id}`);

    // Parse conversation using enhanced parser
    const actions = ConversationParser.parseUserInput(conversationText);
    
    if (actions.length === 0) {
      return NextResponse.json({
        message: 'No extractable data found in conversation',
        commits: [],
        summary: { total: 0, byType: {} }
      });
    }

    const commits = [];
    const summary = { total: 0, byType: {} as Record<string, number> };

    // Process each extracted action
    for (const action of actions) {
      // Skip if in specific mode and this type isn't requested
      if (extractionMode === 'specific' && !targetTypes.includes(action.type)) {
        continue;
      }

      // Skip 'none' type actions
      if (action.type === 'none') {
        continue;
      }

      try {
        const commitData = await createCommitFromAction(
          action,
          conversationText,
          user.id,
          batchId,
          conversationId
        );

        if (commitData) {
          commits.push(commitData);
          summary.total++;
          summary.byType[action.type] = (summary.byType[action.type] || 0) + 1;
        }
      } catch (error) {
        console.error(`Error creating commit for action ${action.type}:`, error);
      }
    }

    // Update batch counters if applicable
    if (batchId && commits.length > 0) {
      await prisma.commitBatch.update({
        where: { id: batchId },
        data: {
          totalCommits: { increment: commits.length },
          pendingCommits: { increment: commits.length }
        }
      });
    }

    return NextResponse.json({
      message: `Extracted ${commits.length} items from conversation`,
      commits,
      summary,
      originalActions: actions
    });

  } catch (error) {
    console.error('Error extracting conversation data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to create commits from conversation actions
async function createCommitFromAction(
  action: any,
  originalText: string,
  userId: string,
  batchId?: string,
  conversationId?: string
) {
  const extractionTypeMap = {
    'add_skill': 'skill',
    'add_company': 'experience',
    'add_education': 'education',
    'add_objective': 'objective',
    'add_key_result': 'key_result'
  };

  const extractionType = extractionTypeMap[action.type as keyof typeof extractionTypeMap];
  if (!extractionType) {
    return null;
  }

  // Generate AI summary based on action type
  const aiSummary = generateAISummary(action);
  
  // Calculate confidence based on action details
  const confidence = calculateConfidence(action);

  // Determine target layer
  const targetLayer = getTargetLayer(extractionType);

  // Structure the extracted data
  const extractedData = structureExtractedData(action, extractionType);

  // Create the commit
  const commit = await prisma.conversationCommit.create({
    data: {
      userId,
      batchId: batchId || null,
      extractionType,
      confidence,
      aiSummary,
      originalText: getRelevantTextSnippet(originalText, action.entity),
      extractedData,
      targetLayer,
      conversationId: conversationId || null,
      status: 'pending'
    },
    include: {
      batch: {
        select: {
          id: true,
          batchTitle: true,
          batchType: true
        }
      }
    }
  });

  return commit;
}

function generateAISummary(action: any): string {
  switch (action.type) {
    case 'add_skill':
      return `Add skill: ${action.entity} (${action.details.proficiency || 'intermediate'} level, ${action.details.experience || 1}+ years)`;
    
    case 'add_company':
      return `Add work experience: ${action.details.role || 'Position'} at ${action.entity}${action.details.industry ? ` (${action.details.industry})` : ''}`;
    
    case 'add_education':
      return `Add education: ${action.details.degree || 'Degree'} from ${action.entity}${action.details.fieldOfStudy ? ` in ${action.details.fieldOfStudy}` : ''}`;
    
    case 'add_objective':
      return `Add objective: ${action.entity} (${action.details.category || 'professional'}, ${action.details.priority || 'medium'} priority)`;
    
    case 'add_key_result':
      return `Add key result: ${action.entity}${action.details.targetValue ? ` (target: ${action.details.targetValue} ${action.details.unit || ''})` : ''}`;
    
    default:
      return `Add ${action.type}: ${action.entity}`;
  }
}

function calculateConfidence(action: any): number {
  let confidence = 0.7; // Base confidence

  // Adjust based on available details
  const detailsCount = Object.keys(action.details || {}).length;
  confidence += Math.min(detailsCount * 0.05, 0.2); // Up to 0.2 bonus for details

  // Adjust based on entity specificity
  if (action.entity && action.entity.length > 10) {
    confidence += 0.05;
  }

  // Adjust based on action type (some are more reliable)
  if (action.type === 'add_skill' || action.type === 'add_company') {
    confidence += 0.05;
  }

  return Math.min(confidence, 0.95); // Cap at 95%
}

function getTargetLayer(extractionType: string): string {
  switch (extractionType) {
    case 'skill':
    case 'experience':
    case 'education':
      return 'surface';
    case 'objective':
    case 'key_result':
      return 'personal';
    default:
      return 'surface';
  }
}

function structureExtractedData(action: any, extractionType: string): any {
  const baseData = {
    originalAction: action.type,
    extractedEntity: action.entity,
    rawDetails: action.details
  };

  switch (extractionType) {
    case 'skill':
      return {
        ...baseData,
        skillName: action.entity,
        proficiency: action.details.proficiency || 'intermediate',
        experience: action.details.experience || 1,
        category: action.details.category || 'Technical',
        isShowcase: true
      };

    case 'experience':
      return {
        ...baseData,
        companyName: action.entity,
        position: action.details.role || 'Software Engineer',
        industry: action.details.industry || null,
        startDate: action.details.startDate || null,
        endDate: action.details.endDate || null,
        isCurrent: !action.details.endDate,
        description: action.details.description || null
      };

    case 'education':
      return {
        ...baseData,
        institutionName: action.entity,
        degree: action.details.degree || 'Bachelor of Science',
        fieldOfStudy: action.details.fieldOfStudy || 'Computer Science',
        startDate: action.details.startDate || null,
        endDate: action.details.endDate || null,
        grade: action.details.grade || null
      };

    case 'objective':
      return {
        ...baseData,
        title: action.entity,
        description: action.details.description || null,
        category: action.details.category || 'professional',
        priority: action.details.priority || 'medium',
        timeframe: action.details.timeframe || 'quarter',
        targetDate: action.details.targetDate || null
      };

    case 'key_result':
      return {
        ...baseData,
        title: action.entity,
        description: action.details.description || null,
        measurementType: action.details.measurementType || 'number',
        targetValue: action.details.targetValue || null,
        unit: action.details.unit || null,
        objectiveId: action.details.parentObjective || null,
        dueDate: action.details.targetDate || null
      };

    default:
      return baseData;
  }
}

function getRelevantTextSnippet(originalText: string, entity: string): string {
  const words = originalText.split(' ');
  const entityIndex = words.findIndex(word => 
    word.toLowerCase().includes(entity.toLowerCase()) || 
    entity.toLowerCase().includes(word.toLowerCase())
  );

  if (entityIndex === -1) {
    return originalText.substring(0, 200) + (originalText.length > 200 ? '...' : '');
  }

  // Get context around the entity mention
  const start = Math.max(0, entityIndex - 10);
  const end = Math.min(words.length, entityIndex + 10);
  
  const snippet = words.slice(start, end).join(' ');
  return (start > 0 ? '...' : '') + snippet + (end < words.length ? '...' : '');
}