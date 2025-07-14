import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

interface WorkExperience {
  id?: string;
  companyId: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentRole: boolean;
}

// POST - Save work experiences
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();

    const body = await request.json();
    const { workExperiences } = body;

    if (!Array.isArray(workExperiences)) {
      return NextResponse.json({ error: 'workExperiences must be an array' }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing work experiences
      await tx.workExperience.deleteMany({
        where: { userId: user.id }
      });

      const savedExperiences = [];

      // Create new work experiences
      if (workExperiences.length > 0) {
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

            const savedExp = await tx.workExperience.create({
              data: {
                userId: user.id,
                companyId: actualCompanyId,
                title: exp.position,
                startDate: exp.startDate && exp.startDate.trim() !== '' ? new Date(exp.startDate) : null,
                endDate: exp.endDate && exp.endDate.trim() !== '' && !exp.isCurrentRole ? new Date(exp.endDate) : null,
                description: exp.description || undefined,
                isCurrent: exp.isCurrentRole || false
              },
              include: {
                company: true
              }
            });
            
            savedExperiences.push(savedExp);
          }
        }
      }

      return savedExperiences;
    });

    return NextResponse.json({ 
      message: 'Work experiences saved successfully',
      workExperiences: result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving work experiences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's work experiences
export async function GET() {
  try {
    const { user } = await getOrCreateUser();

    const userWithExperiences = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        workExperiences: {
          include: {
            company: true
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });

    return NextResponse.json({
      workExperiences: userWithExperiences?.workExperiences || []
    });

  } catch (error) {
    console.error('Error fetching work experiences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}