import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

interface Education {
  id?: string;
  institutionId: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  grade?: string;
}

// POST - Save education
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();

    const body = await request.json();
    const { educations } = body;

    if (!Array.isArray(educations)) {
      return NextResponse.json({ error: 'educations must be an array' }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing education
      await tx.userEducation.deleteMany({
        where: { userId: user.id }
      });

      const savedEducations = [];

      // Create new education entries
      if (educations.length > 0) {
        for (const edu of educations) {
          if (edu.institutionId && edu.degree && edu.fieldOfStudy) {
            // Handle test institution IDs
            let actualInstitutionId = edu.institutionId;
            if (edu.institutionId.startsWith('test-institution-')) {
              const testInstitutions: Record<string, { name: string; type: string; country: string }> = {
                'test-institution-1': { name: 'University of Technology', type: 'University', country: 'US' },
                'test-institution-2': { name: 'Tech Institute', type: 'Institute', country: 'US' },
                'test-institution-3': { name: 'State University', type: 'University', country: 'US' }
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

            const savedEdu = await tx.userEducation.create({
              data: {
                userId: user.id,
                institutionId: actualInstitutionId,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy,
                startDate: edu.startDate && edu.startDate.trim() !== '' ? new Date(edu.startDate) : null,
                endDate: edu.endDate && edu.endDate.trim() !== '' ? new Date(edu.endDate) : null,
                gpa: edu.grade || undefined
              },
              include: {
                institution: true
              }
            });
            
            savedEducations.push(savedEdu);
          }
        }
      }

      return savedEducations;
    });

    return NextResponse.json({ 
      message: 'Education saved successfully',
      educations: result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving education:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's education
export async function GET() {
  try {
    const { user } = await getOrCreateUser();

    const userWithEducation = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userEducation: {
          include: {
            institution: true
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });

    return NextResponse.json({
      educations: userWithEducation?.userEducation || []
    });

  } catch (error) {
    console.error('Error fetching education:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}