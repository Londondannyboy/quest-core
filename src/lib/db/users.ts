import { prisma } from '@/lib/prisma';

export async function getOrCreateUser(clerkId: string, email: string, name?: string) {
  try {
    // Try to find existing user with full repo context
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        surfaceProfile: true,
        workingProfile: {
          include: {
            workingProjects: {
              include: {
                company: true,
                workingMedia: true
              }
            },
            workingAchievements: {
              include: {
                workingMedia: true
              }
            }
          }
        },
        personalGoals: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        trinityCore: true,
        userSkills: {
          include: {
            skill: true
          },
          where: { isShowcase: true },
          take: 10
        },
        workExperiences: {
          include: {
            company: true
          },
          orderBy: { startDate: 'desc' },
          take: 3
        }
      }
    });

    // Create new user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: name || email.split('@')[0],
        },
        include: {
          surfaceProfile: true,
          workingProfile: true,
          personalGoals: true,
          trinityCore: true,
          userSkills: {
            include: {
              skill: true
            }
          },
          workExperiences: {
            include: {
              company: true
            }
          }
        }
      });
    }

    return user;
  } catch (error) {
    console.error('[DB] Error in getOrCreateUser:', error);
    throw error;
  }
}

export async function getUserByClerkId(clerkId: string) {
  try {
    return await prisma.user.findUnique({
      where: { clerkId },
      include: {
        surfaceProfile: true,
        workingProfile: {
          include: {
            workingProjects: {
              include: {
                company: true,
                workingMedia: true
              }
            },
            workingAchievements: {
              include: {
                workingMedia: true
              }
            }
          }
        },
        personalGoals: {
          orderBy: { createdAt: 'desc' }
        },
        trinityCore: true,
        userSkills: {
          include: {
            skill: true
          },
          orderBy: { createdAt: 'desc' }
        },
        workExperiences: {
          include: {
            company: true
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });
  } catch (error) {
    console.error('[DB] Error in getUserByClerkId:', error);
    return null;
  }
}

export async function createConversation(userId: string, sessionId: string, type: 'voice' | 'text' = 'voice') {
  try {
    return await prisma.conversation.create({
      data: {
        userId,
        sessionId,
        type,
      }
    });
  } catch (error) {
    console.error('[DB] Error creating conversation:', error);
    throw error;
  }
}

export async function addMessageToConversation(
  conversationId: string, 
  role: 'user' | 'assistant', 
  content: string,
  emotions?: any,
  repoReferences?: any
) {
  try {
    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        emotions: emotions || undefined,
        repoReferences: repoReferences || undefined
      }
    });
  } catch (error) {
    console.error('[DB] Error adding message:', error);
    throw error;
  }
}

// Helper function to get comprehensive user context for voice coaching
export async function getUserRepoContext(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        surfaceProfile: true,
        workingProfile: {
          include: {
            workingProjects: {
              include: {
                company: true,
                workingMedia: true,
                projectRelationships: {
                  include: {
                    contact: true
                  }
                }
              }
            },
            workingAchievements: {
              include: {
                workingMedia: true
              }
            }
          }
        },
        personalGoals: {
          orderBy: { createdAt: 'desc' }
        },
        personalNotes: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        trinityCore: true,
        deepInsights: {
          orderBy: { generatedAt: 'desc' },
          take: 5
        },
        userSkills: {
          include: {
            skill: true
          },
          orderBy: { yearsOfExperience: 'desc' }
        },
        workExperiences: {
          include: {
            company: true,
            workRelationships: {
              include: {
                contact: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        },
        userEducation: {
          include: {
            institution: true,
            educationRelationships: {
              include: {
                contact: true
              }
            }
          }
        },
        userCertifications: {
          include: {
            certification: true
          }
        }
      }
    });

    return user;
  } catch (error) {
    console.error('[DB] Error getting user repo context:', error);
    return null;
  }
}

// Helper function to find or create entities (companies, skills, etc.)
export async function findOrCreateCompany(name: string, website?: string) {
  try {
    let company = await prisma.company.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name,
          website,
          domain: website ? new URL(website).hostname : undefined
        }
      });
    }

    return company;
  } catch (error) {
    console.error('[DB] Error in findOrCreateCompany:', error);
    throw error;
  }
}

export async function findOrCreateSkill(name: string, category?: string) {
  try {
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name,
          category
        }
      });
    }

    return skill;
  } catch (error) {
    console.error('[DB] Error in findOrCreateSkill:', error);
    throw error;
  }
}