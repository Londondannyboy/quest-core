import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Create/Update Working Profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, projects, achievements } = body;

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create or update working profile
      const workingProfile = await tx.workingProfile.upsert({
        where: { userId: user.id },
        update: {
          title: profile.title || undefined,
          description: profile.description || undefined
        },
        create: {
          userId: user.id,
          title: profile.title || 'Professional Portfolio',
          description: profile.description || undefined
        }
      });

      // Delete existing projects and create new ones
      await tx.workingProject.deleteMany({
        where: { userId: user.id }
      });

      if (projects && projects.length > 0) {
        for (const project of projects) {
          if (project.title && project.title.trim() !== '') {
            await tx.workingProject.create({
              data: {
                userId: user.id,
                workingProfileId: workingProfile.id,
                title: project.title,
                companyId: project.companyId || undefined,
                description: project.description || undefined,
                challenge: project.challenge || undefined,
                solution: project.solution || undefined,
                impact: project.impact || undefined,
                technologies: project.technologies || undefined,
                startDate: project.startDate && project.startDate.trim() !== '' ? new Date(project.startDate) : null,
                endDate: project.endDate && project.endDate.trim() !== '' ? new Date(project.endDate) : null,
                projectType: project.projectType || 'Professional'
              }
            });
          }
        }
      }

      // Delete existing achievements and create new ones
      await tx.workingAchievement.deleteMany({
        where: { userId: user.id }
      });

      if (achievements && achievements.length > 0) {
        for (const achievement of achievements) {
          if (achievement.title && achievement.title.trim() !== '') {
            await tx.workingAchievement.create({
              data: {
                userId: user.id,
                workingProfileId: workingProfile.id,
                title: achievement.title,
                description: achievement.description || undefined,
                context: achievement.context || undefined,
                quantifiedImpact: achievement.quantifiedImpact || undefined,
                skillsDemonstrated: achievement.skillsDemonstrated || undefined,
                recognition: achievement.recognition || undefined,
                dateAchieved: achievement.dateAchieved && achievement.dateAchieved.trim() !== '' ? new Date(achievement.dateAchieved) : null
              }
            });
          }
        }
      }

      return workingProfile;
    });

    return NextResponse.json({ 
      message: 'Working profile saved successfully',
      profile: result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving working profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's working profile
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        workingProfile: {
          include: {
            workingProjects: {
              include: {
                company: true
              },
              orderBy: { startDate: 'desc' }
            },
            workingAchievements: {
              orderBy: { dateAchieved: 'desc' }
            },
            workingMedia: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: user.workingProfile,
      projects: user.workingProfile?.workingProjects || [],
      achievements: user.workingProfile?.workingAchievements || [],
      media: user.workingProfile?.workingMedia || []
    });

  } catch (error) {
    console.error('Error fetching working profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}