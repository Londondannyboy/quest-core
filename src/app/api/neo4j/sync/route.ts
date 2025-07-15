import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { Neo4jSchemaManager } from '@/lib/neo4j-schema';

// POST - Sync user data from PostgreSQL to Neo4j
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await getOrCreateUser();
    
    // Fetch complete user data with all relationships
    const userData = await prisma.user.findUnique({
      where: { id: user.user.id },
      include: {
        workExperiences: {
          include: {
            company: true
          },
          orderBy: { startDate: 'desc' }
        },
        userSkills: {
          include: {
            skill: true
          },
          orderBy: { yearsOfExperience: 'desc' }
        },
        userEducation: {
          include: {
            institution: true
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize Neo4j schema first
    await Neo4jSchemaManager.initializeSchema();

    // Sync user data to Neo4j
    await Neo4jSchemaManager.syncUserData({
      id: userData.id,
      clerkId: userData.clerkId,
      email: userData.email,
      name: userData.name || undefined,
      workExperiences: userData.workExperiences.map(exp => ({
        id: exp.id,
        companyId: exp.companyId,
        company: {
          name: exp.company.name,
          industry: exp.company.industry || undefined,
          website: exp.company.website || undefined
        },
        title: exp.title,
        startDate: exp.startDate || undefined,
        endDate: exp.endDate || undefined,
        isCurrent: exp.isCurrent,
        description: exp.description || undefined
      })),
      userSkills: userData.userSkills.map(skill => ({
        id: skill.id,
        skillId: skill.skillId,
        skill: {
          name: skill.skill.name,
          category: skill.skill.category || undefined,
          difficultyLevel: skill.skill.difficultyLevel || undefined
        },
        proficiencyLevel: skill.proficiencyLevel || 'intermediate',
        yearsOfExperience: skill.yearsOfExperience || 0,
        isShowcase: skill.isShowcase
      })),
      userEducation: userData.userEducation.map(edu => ({
        id: edu.id,
        institutionId: edu.institutionId,
        institution: {
          name: edu.institution.name,
          type: edu.institution.type || undefined,
          country: edu.institution.country || undefined
        },
        degree: edu.degree || 'Unknown',
        fieldOfStudy: edu.fieldOfStudy || 'Unknown',
        startDate: edu.startDate || undefined,
        endDate: edu.endDate || undefined,
        gpa: edu.gpa || undefined
      }))
    });

    // Get professional network data for response
    const networkData = await Neo4jSchemaManager.getProfessionalNetworkData(userData.id);

    return NextResponse.json({
      message: 'Data synced successfully to Neo4j',
      userId: userData.id,
      networkData: networkData,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing data to Neo4j:', error);
    return NextResponse.json({ 
      error: 'Failed to sync data to Neo4j',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get current user's Neo4j network data
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();
    
    // Get professional network data from Neo4j
    const networkData = await Neo4jSchemaManager.getProfessionalNetworkData(user.user.id);
    
    // Get career insights
    const careerInsights = await Neo4jSchemaManager.getCareerInsights(user.user.id);

    return NextResponse.json({
      userId: user.user.id,
      networkData: networkData,
      careerInsights: careerInsights,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting Neo4j data:', error);
    return NextResponse.json({ 
      error: 'Failed to get Neo4j data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Clean up user data (for development)
export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const user = await getOrCreateUser();
    
    // Clean up user data from Neo4j
    await Neo4jSchemaManager.cleanupUserData(user.user.id);

    return NextResponse.json({
      message: 'User data cleaned up from Neo4j',
      userId: user.user.id,
      cleanedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up Neo4j data:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up Neo4j data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}