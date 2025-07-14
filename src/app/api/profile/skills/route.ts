import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface UserSkill {
  id?: string;
  skillId: string;
  yearsOfExperience: number;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isShowcase: boolean;
}

// POST - Save skills
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skills } = body;

    if (!Array.isArray(skills)) {
      return NextResponse.json({ error: 'skills must be an array' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing skills
      await tx.userSkill.deleteMany({
        where: { userId: user.id }
      });

      const savedSkills = [];

      // Create new skills
      if (skills.length > 0) {
        for (const skill of skills) {
          if (skill.skillId && skill.yearsOfExperience !== undefined && skill.proficiencyLevel) {
            // Handle test skill IDs
            let actualSkillId = skill.skillId;
            if (skill.skillId.startsWith('test-skill-')) {
              const testSkills: Record<string, { name: string; category: string; difficulty: string }> = {
                'test-skill-1': { name: 'JavaScript', category: 'Programming', difficulty: 'intermediate' },
                'test-skill-2': { name: 'React', category: 'Frontend', difficulty: 'intermediate' },
                'test-skill-3': { name: 'Node.js', category: 'Backend', difficulty: 'intermediate' },
                'test-skill-4': { name: 'Python', category: 'Programming', difficulty: 'beginner' },
                'test-skill-5': { name: 'SQL', category: 'Database', difficulty: 'intermediate' }
              };
              
              const skillData = testSkills[skill.skillId];
              if (skillData) {
                // Find existing skill or create new one
                let existingSkill = await tx.skill.findFirst({
                  where: { name: skillData.name }
                });
                
                if (!existingSkill) {
                  existingSkill = await tx.skill.create({
                    data: {
                      name: skillData.name,
                      category: skillData.category,
                      difficultyLevel: skillData.difficulty,
                      verified: false
                    }
                  });
                }
                
                actualSkillId = existingSkill.id;
              }
            }

            const savedSkill = await tx.userSkill.create({
              data: {
                userId: user.id,
                skillId: actualSkillId,
                yearsOfExperience: skill.yearsOfExperience,
                proficiencyLevel: skill.proficiencyLevel,
                isShowcase: skill.isShowcase || false
              },
              include: {
                skill: true
              }
            });
            
            savedSkills.push(savedSkill);
          }
        }
      }

      return savedSkills;
    });

    return NextResponse.json({ 
      message: 'Skills saved successfully',
      skills: result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's skills
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        userSkills: {
          include: {
            skill: true
          },
          orderBy: { yearsOfExperience: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      skills: user.userSkills
    });

  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}