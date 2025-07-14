import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Get or create user in database from Clerk authentication
 * This ensures users exist in the database when they access profile features
 */
export async function getOrCreateUser() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (!user) {
    // Create new user automatically
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error('Clerk user not found');
    }

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User'
      }
    });
  }

  return { user, userId };
}

/**
 * Validate authentication and ensure user exists
 * Returns consistent error responses for API routes
 */
export async function validateAuthAndUser() {
  try {
    return await getOrCreateUser();
  } catch (error) {
    return null;
  }
}