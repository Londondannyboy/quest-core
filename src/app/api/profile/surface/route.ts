import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Create/Update Surface Profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, workExperiences, educations, skills } = body;

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create or update surface profile
      const surfaceProfile = await tx.surfaceProfile.upsert({
        where: { userId: user.id },
        update: {
          headline: profile.headline || undefined,
          location: profile.location || undefined,
          publicBio: profile.about || undefined
        },
        create: {
          userId: user.id,
          headline: profile.headline || undefined,
          location: profile.location || undefined,
          publicBio: profile.about || undefined
        }
      });

      // Delete existing work experiences and create new ones
      await tx.workExperience.deleteMany({
        where: { userId: user.id }
      });

      if (workExperiences && workExperiences.length > 0) {
        for (const exp of workExperiences) {
          if (exp.companyId && exp.position) {
            await tx.workExperience.create({
              data: {
                userId: user.id,
                companyId: exp.companyId,
                position: exp.position,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                description: exp.description || undefined,
                isCurrentRole: exp.isCurrentRole || false
              }
            });
          }
        }
      }

      // Delete existing education and create new ones
      await tx.userEducation.deleteMany({
        where: { userId: user.id }
      });

      if (educations && educations.length > 0) {
        for (const edu of educations) {
          if (edu.institutionId && edu.degree) {
            await tx.userEducation.create({
              data: {
                userId: user.id,
                institutionId: edu.institutionId,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy || undefined,
                startDate: edu.startDate ? new Date(edu.startDate) : null,
                endDate: edu.endDate ? new Date(edu.endDate) : null,
                grade: edu.grade || undefined
              }
            });
          }
        }
      }

      // Delete existing skills and create new ones
      await tx.userSkill.deleteMany({
        where: { userId: user.id }
      });

      if (skills && skills.length > 0) {
        for (const skill of skills) {
          if (skill.skillId) {
            await tx.userSkill.create({
              data: {
                userId: user.id,
                skillId: skill.skillId,
                yearsOfExperience: skill.yearsOfExperience || 1,
                proficiencyLevel: skill.proficiencyLevel || 'intermediate',
                isShowcase: skill.isShowcase || false
              }
            });
          }
        }
      }

      return surfaceProfile;
    });

    return NextResponse.json({ 
      message: 'Surface profile saved successfully',
      profile: result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving surface profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's surface profile
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        surfaceProfile: true,
        workExperiences: {
          include: {
            company: true
          },
          orderBy: { startDate: 'desc' }
        },
        userEducation: {
          include: {
            institution: true
          },
          orderBy: { startDate: 'desc' }
        },
        userSkills: {
          include: {
            skill: true
          },
          where: { isShowcase: true },
          orderBy: { yearsOfExperience: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: user.surfaceProfile,
      workExperiences: user.workExperiences,
      education: user.userEducation,
      skills: user.userSkills
    });

  } catch (error) {
    console.error('Error fetching surface profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}