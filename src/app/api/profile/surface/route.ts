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

      // Delete existing education and create new ones
      await tx.userEducation.deleteMany({
        where: { userId: user.id }
      });

      if (educations && educations.length > 0) {
        for (const edu of educations) {
          if (edu.institutionId && edu.degree) {
            // Handle test institution IDs
            let actualInstitutionId = edu.institutionId;
            if (edu.institutionId.startsWith('test-institution-')) {
              const testInstitutions: Record<string, { name: string; type: string; country: string }> = {
                'test-institution-1': { name: 'University of Technology', type: 'university', country: 'United States' },
                'test-institution-2': { name: 'Community College Central', type: 'community_college', country: 'United States' },
                'test-institution-3': { name: 'Coding Bootcamp Pro', type: 'bootcamp', country: 'United States' }
              };
              
              const institutionData = testInstitutions[edu.institutionId];
              if (institutionData) {
                // Find existing institution or create new one
                let institution = await tx.educationalInstitution.findFirst({
                  where: { name: institutionData.name }
                });
                
                if (!institution) {
                  institution = await tx.educationalInstitution.create({
                    data: {
                      name: institutionData.name,
                      type: institutionData.type,
                      country: institutionData.country,
                      verified: false
                    }
                  });
                }
                
                actualInstitutionId = institution.id;
              }
            }

            await tx.userEducation.create({
              data: {
                userId: user.id,
                institutionId: actualInstitutionId,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy || undefined,
                startDate: edu.startDate && edu.startDate.trim() !== '' ? new Date(edu.startDate) : null,
                endDate: edu.endDate && edu.endDate.trim() !== '' ? new Date(edu.endDate) : null,
                gpa: edu.grade || undefined
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
            // Handle test skill IDs
            let actualSkillId = skill.skillId;
            if (skill.skillId.startsWith('test-skill-')) {
              const testSkills: Record<string, { name: string; category: string }> = {
                'test-skill-1': { name: 'JavaScript', category: 'Programming Languages' },
                'test-skill-2': { name: 'React', category: 'Web Development' },
                'test-skill-3': { name: 'Node.js', category: 'Web Development' },
                'test-skill-4': { name: 'Python', category: 'Programming Languages' },
                'test-skill-5': { name: 'AWS', category: 'Cloud Computing' }
              };
              
              const skillData = testSkills[skill.skillId];
              if (skillData) {
                // Create or find the skill (name is unique)
                const skillEntity = await tx.skill.upsert({
                  where: { name: skillData.name },
                  update: {},
                  create: {
                    name: skillData.name,
                    category: skillData.category,
                    verified: false
                  }
                });
                actualSkillId = skillEntity.id;
              }
            }

            await tx.userSkill.create({
              data: {
                userId: user.id,
                skillId: actualSkillId,
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