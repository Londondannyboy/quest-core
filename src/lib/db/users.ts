import { prisma } from '@/lib/prisma';

export async function getOrCreateUser(clerkId: string, email: string, name?: string) {
  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        trinityStatements: {
          orderBy: { order: 'asc' }
        },
        skills: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Create new user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: name || email.split('@')[0], // Use email prefix as default name
        },
        include: {
          trinityStatements: true,
          skills: true
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
        trinityStatements: {
          orderBy: { order: 'asc' }
        },
        skills: {
          orderBy: { createdAt: 'desc' }
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
  emotions?: any
) {
  try {
    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        emotions: emotions || undefined
      }
    });
  } catch (error) {
    console.error('[DB] Error adding message:', error);
    throw error;
  }
}