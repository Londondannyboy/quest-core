import { prisma } from '../src/lib/prisma';

async function checkUserIsolation() {
  console.log('Checking user isolation and data integrity...\n');
  
  try {
    // Check all users in the database
    const users = await prisma.user.findMany({
      include: {
        trinityCore: true,
        userSkills: {
          include: {
            skill: true
          }
        },
        conversations: {
          include: {
            messages: true
          }
        }
      }
    });
    
    console.log(`Found ${users.length} users in Quest Core database:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name} (${user.email})`);
      console.log(`   Clerk ID: ${user.clerkId}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log(`   Trinity Core: ${user.trinityCore ? 'Yes' : 'No'}`);
      console.log(`   Skills: ${user.userSkills.length}`);
      console.log(`   Conversations: ${user.conversations.length}`);
      
      if (user.conversations.length > 0) {
        const totalMessages = user.conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
        console.log(`   Total Messages: ${totalMessages}`);
      }
    });
    
    // Check for potential data bleed
    console.log('\n--- Data Integrity Check ---');
    
    // Check if any conversations have messages from different users
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: true,
        user: true
      }
    });
    
    conversations.forEach(conv => {
      if (conv.messages.length > 0) {
        console.log(`Conversation ${conv.sessionId} belongs to ${conv.user.email} (${conv.messages.length} messages)`);
      }
    });
    
    console.log('\n✅ User isolation check complete');
    
  } catch (error) {
    console.error('❌ Error checking user isolation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserIsolation();