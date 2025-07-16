import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// POST - Process approved commits and add them to the repository
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { commitIds, batchId } = body;

    console.log(`Processing commits for user ${user.id}:`, commitIds);

    const results = {
      successful: [],
      failed: [],
      summary: {
        total: 0,
        skills: 0,
        experiences: 0,
        education: 0,
        objectives: 0,
        keyResults: 0
      }
    };

    // Fetch commits to process
    const whereClause: any = { userId: user.id, status: 'approved' };
    if (commitIds && commitIds.length > 0) {
      whereClause.id = { in: commitIds };
    } else if (batchId) {
      whereClause.batchId = batchId;
    }

    const commits = await prisma.conversationCommit.findMany({
      where: whereClause,
      include: {
        batch: true
      }
    });

    if (commits.length === 0) {
      return NextResponse.json({ 
        error: 'No approved commits found to process',
        results 
      }, { status: 400 });
    }

    // Process each commit
    for (const commit of commits) {
      try {
        let processResult = null;

        switch (commit.extractionType) {
          case 'skill':
            processResult = await processSkillCommit(commit, user.id);
            if (processResult.success) results.summary.skills++;
            break;
          
          case 'experience':
            processResult = await processExperienceCommit(commit, user.id);
            if (processResult.success) results.summary.experiences++;
            break;
          
          case 'education':
            processResult = await processEducationCommit(commit, user.id);
            if (processResult.success) results.summary.education++;
            break;
          
          case 'objective':
            processResult = await processObjectiveCommit(commit, user.id);
            if (processResult.success) results.summary.objectives++;
            break;
          
          case 'key_result':
            processResult = await processKeyResultCommit(commit, user.id);
            if (processResult.success) results.summary.keyResults++;
            break;
          
          default:
            processResult = { success: false, error: `Unknown extraction type: ${commit.extractionType}` };
        }

        if (processResult.success) {
          // Update commit status to committed
          await prisma.conversationCommit.update({
            where: { id: commit.id },
            data: {
              status: 'committed',
              committedAt: new Date()
            }
          });

          results.successful.push({
            commitId: commit.id,
            type: commit.extractionType,
            summary: commit.aiSummary,
            repositoryId: processResult.repositoryId
          });
        } else {
          results.failed.push({
            commitId: commit.id,
            type: commit.extractionType,
            summary: commit.aiSummary,
            error: processResult.error
          });
        }

        results.summary.total++;
      } catch (error) {
        console.error(`Error processing commit ${commit.id}:`, error);
        results.failed.push({
          commitId: commit.id,
          type: commit.extractionType,
          summary: commit.aiSummary,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update batch counters
    if (batchId || commits[0]?.batchId) {
      const targetBatchId = batchId || commits[0].batchId;
      const successCount = results.successful.length;
      
      await prisma.commitBatch.update({
        where: { id: targetBatchId },
        data: {
          approvedCommits: { decrement: successCount },
          committedCommits: { increment: successCount }
        }
      });
    }

    return NextResponse.json({
      message: `Processed ${results.summary.total} commits successfully`,
      results
    });

  } catch (error) {
    console.error('Error processing commits:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions for processing different types of commits
async function processSkillCommit(commit: any, userId: string) {
  try {
    const data = commit.extractedData;
    const finalData = commit.suggestedEdits ? { ...data, ...commit.suggestedEdits } : data;

    // Try to find existing skill
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: finalData.skillName, mode: 'insensitive' } }
    });

    // Create skill if it doesn't exist
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: finalData.skillName,
          category: finalData.category || 'Technical',
          difficultyLevel: finalData.proficiency || 'intermediate'
        }
      });
    }

    // Add to user's skills
    const userSkill = await prisma.userSkill.create({
      data: {
        userId,
        skillId: skill.id,
        proficiencyLevel: finalData.proficiency || 'intermediate',
        yearsOfExperience: finalData.experience || 1,
        isShowcase: finalData.isShowcase || true
      }
    });

    return { success: true, repositoryId: userSkill.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function processExperienceCommit(commit: any, userId: string) {
  try {
    const data = commit.extractedData;
    const finalData = commit.suggestedEdits ? { ...data, ...commit.suggestedEdits } : data;

    // Try to find existing company
    let company = await prisma.company.findFirst({
      where: { name: { equals: finalData.companyName, mode: 'insensitive' } }
    });

    // Create company if it doesn't exist
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: finalData.companyName,
          industry: finalData.industry || 'Technology',
          website: finalData.website || null
        }
      });
    }

    // Add work experience
    const workExperience = await prisma.workExperience.create({
      data: {
        userId,
        companyId: company.id,
        position: finalData.position || 'Software Engineer',
        startDate: finalData.startDate ? new Date(finalData.startDate) : null,
        endDate: finalData.endDate ? new Date(finalData.endDate) : null,
        isCurrent: finalData.isCurrent || false,
        description: finalData.description || null
      }
    });

    return { success: true, repositoryId: workExperience.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function processEducationCommit(commit: any, userId: string) {
  try {
    const data = commit.extractedData;
    const finalData = commit.suggestedEdits ? { ...data, ...commit.suggestedEdits } : data;

    // Try to find existing institution
    let institution = await prisma.educationalInstitution.findFirst({
      where: { name: { equals: finalData.institutionName, mode: 'insensitive' } }
    });

    // Create institution if it doesn't exist
    if (!institution) {
      institution = await prisma.educationalInstitution.create({
        data: {
          name: finalData.institutionName,
          type: finalData.type || 'University',
          country: finalData.country || 'United States'
        }
      });
    }

    // Add education
    const education = await prisma.userEducation.create({
      data: {
        userId,
        institutionId: institution.id,
        degree: finalData.degree || 'Bachelor of Science',
        fieldOfStudy: finalData.fieldOfStudy || 'Computer Science',
        startDate: finalData.startDate ? new Date(finalData.startDate) : null,
        endDate: finalData.endDate ? new Date(finalData.endDate) : null,
        grade: finalData.grade || null
      }
    });

    return { success: true, repositoryId: education.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function processObjectiveCommit(commit: any, userId: string) {
  try {
    const data = commit.extractedData;
    const finalData = commit.suggestedEdits ? { ...data, ...commit.suggestedEdits } : data;

    const objective = await prisma.objective.create({
      data: {
        userId,
        title: finalData.title,
        description: finalData.description || null,
        category: finalData.category || 'professional',
        priority: finalData.priority || 'medium',
        timeframe: finalData.timeframe || 'quarter',
        targetDate: finalData.targetDate ? new Date(finalData.targetDate) : null,
        status: 'active'
      }
    });

    return { success: true, repositoryId: objective.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function processKeyResultCommit(commit: any, userId: string) {
  try {
    const data = commit.extractedData;
    const finalData = commit.suggestedEdits ? { ...data, ...commit.suggestedEdits } : data;

    // Verify the objective exists and belongs to the user
    const objective = await prisma.objective.findFirst({
      where: { 
        id: finalData.objectiveId,
        userId 
      }
    });

    if (!objective) {
      throw new Error('Objective not found or does not belong to user');
    }

    const keyResult = await prisma.keyResult.create({
      data: {
        objectiveId: finalData.objectiveId,
        title: finalData.title,
        description: finalData.description || null,
        measurementType: finalData.measurementType || 'number',
        targetValue: finalData.targetValue || null,
        currentValue: finalData.currentValue || 0,
        unit: finalData.unit || null,
        status: 'active',
        dueDate: finalData.dueDate ? new Date(finalData.dueDate) : null
      }
    });

    return { success: true, repositoryId: keyResult.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}