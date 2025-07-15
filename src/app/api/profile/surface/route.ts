import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
// POST - Create/Update Surface Profile
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();

    const body = await request.json();
    const { profile, workExperiences, educations, skills } = body;

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
            // Handle test company IDs
            let actualCompanyId = exp.companyId;
            if (exp.companyId.startsWith('test-company-')) {
              const testCompanies: Record<string, { name: string; industry: string }> = {
                'test-company-1': { name: 'Tech Corp Ltd', industry: 'Software Development' },
                'test-company-2': { name: 'StartupXYZ', industry: 'Technology' },
                'test-company-3': { name: 'BigCorp Inc', industry: 'Enterprise Software' }
              };
              
              const companyData = testCompanies[exp.companyId];
              if (companyData) {
                // Find existing company or create new one
                let company = await tx.company.findFirst({
                  where: { name: companyData.name }
                });
                
                if (!company) {
                  company = await tx.company.create({
                    data: {
                      name: companyData.name,
                      industry: companyData.industry,
                      verified: false
                    }
                  });
                }
                
                actualCompanyId = company.id;
              }
            }

            await tx.workExperience.create({
              data: {
                userId: user.id,
                companyId: actualCompanyId,
                title: exp.position,
                startDate: exp.startDate && exp.startDate.trim() !== '' ? new Date(exp.startDate) : null,
                endDate: exp.endDate && exp.endDate.trim() !== '' ? new Date(exp.endDate) : null,
                description: exp.description || undefined,
                isCurrent: exp.isCurrentRole || false
              }
            });
          }
        }
      }

      // Note: Education and skills are handled by their respective dedicated API routes
      // /api/profile/education and /api/profile/skills

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
    const { user } = await getOrCreateUser();

    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
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

    return NextResponse.json({
      profile: userWithProfile?.surfaceProfile,
      workExperiences: userWithProfile?.workExperiences || [],
      education: userWithProfile?.userEducation || [],
      skills: userWithProfile?.userSkills || []
    });

  } catch (error) {
    console.error('Error fetching surface profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}