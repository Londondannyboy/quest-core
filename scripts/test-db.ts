import { prisma } from '../src/lib/prisma';
import { getOrCreateUser } from '../src/lib/db/users';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test user creation
    const testUser = await getOrCreateUser('test_clerk_id', 'test@quest-core.com', 'Test User');
    console.log('✅ User created/retrieved:', {
      id: testUser.id,
      name: testUser.name,
      email: testUser.email
    });
    
    // Check tables
    const userCount = await prisma.user.count();
    console.log(`✅ Total users in database: ${userCount}`);
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();