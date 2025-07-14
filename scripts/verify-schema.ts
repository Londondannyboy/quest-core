import { prisma } from '../src/lib/prisma';

async function verifySchema() {
  console.log('🔍 Verifying 4-Layer Repo Schema...\n');
  
  try {
    // Test Core Entity Tables
    console.log('📊 Core Entity Tables:');
    const companyCount = await prisma.company.count();
    const skillCount = await prisma.skill.count();
    const educationCount = await prisma.educationalInstitution.count();
    const certCount = await prisma.certification.count();
    console.log(`  Companies: ${companyCount}`);
    console.log(`  Skills: ${skillCount}`);
    console.log(`  Educational Institutions: ${educationCount}`);
    console.log(`  Certifications: ${certCount}`);
    
    // Test User and Profile Tables
    console.log('\n👤 User and Profile Tables:');
    const userCount = await prisma.user.count();
    const surfaceCount = await prisma.surfaceProfile.count();
    const workingCount = await prisma.workingProfile.count();
    const trinityCount = await prisma.trinityCore.count();
    console.log(`  Users: ${userCount}`);
    console.log(`  Surface Profiles: ${surfaceCount}`);
    console.log(`  Working Profiles: ${workingCount}`);
    console.log(`  Trinity Cores: ${trinityCount}`);
    
    // Test Professional Relationship Tables
    console.log('\n🤝 Professional Relationship Tables:');
    const contactCount = await prisma.professionalContact.count();
    const workRelCount = await prisma.workRelationship.count();
    const projectRelCount = await prisma.projectRelationship.count();
    const eduRelCount = await prisma.educationRelationship.count();
    console.log(`  Professional Contacts: ${contactCount}`);
    console.log(`  Work Relationships: ${workRelCount}`);
    console.log(`  Project Relationships: ${projectRelCount}`);
    console.log(`  Education Relationships: ${eduRelCount}`);
    
    // Test Voice Coaching Tables
    console.log('\n🎤 Voice Coaching Tables:');
    const conversationCount = await prisma.conversation.count();
    const messageCount = await prisma.message.count();
    console.log(`  Conversations: ${conversationCount}`);
    console.log(`  Messages: ${messageCount}`);
    
    // Test Working Repo Tables
    console.log('\n💼 Working Repo Tables:');
    const projectCount = await prisma.workingProject.count();
    const achievementCount = await prisma.workingAchievement.count();
    const mediaCount = await prisma.workingMedia.count();
    const accessCount = await prisma.workingAccessPermission.count();
    console.log(`  Working Projects: ${projectCount}`);
    console.log(`  Working Achievements: ${achievementCount}`);
    console.log(`  Working Media: ${mediaCount}`);
    console.log(`  Access Permissions: ${accessCount}`);
    
    // Test Personal Repo Tables
    console.log('\n📝 Personal Repo Tables:');
    const goalCount = await prisma.personalGoal.count();
    const noteCount = await prisma.personalNote.count();
    const insightCount = await prisma.deepInsight.count();
    console.log(`  Personal Goals: ${goalCount}`);
    console.log(`  Personal Notes: ${noteCount}`);
    console.log(`  Deep Insights: ${insightCount}`);
    
    console.log('\n✅ 4-Layer Repository Schema Verification Complete!');
    console.log('\n🏗️ Architecture Summary:');
    console.log('  📍 Surface Repo: Public profiles with entity relationships');
    console.log('  💼 Working Repo: Selective portfolio with access control');
    console.log('  📝 Personal Repo: Private goals and development tracking');
    console.log('  🤖 Deep Repo: AI-powered insights and Trinity analysis');
    console.log('  🤝 Relationship Intelligence: Neo4j-ready professional networks');
    console.log('  🎤 Voice Coaching: Enhanced with full repo context');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();