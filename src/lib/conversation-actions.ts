import { prisma } from '@/lib/prisma';
import { ConversationAction } from './conversation-parser';

// Server-side conversation actions that work with Prisma directly
export class ConversationActions {
  
  // Process conversation actions and create database entries
  static async processConversationActions(userId: string, actions: ConversationAction[]) {
    const results = [];
    
    for (const action of actions) {
      try {
        let result;
        
        switch (action.type) {
          case 'add_skill':
            result = await this.createSkillFromConversation(userId, action.entity, action.details);
            break;
            
          case 'add_company':
            result = await this.createCompanyFromConversation(userId, action.entity, action.details);
            break;
            
          case 'add_education':
            result = await this.createEducationFromConversation(userId, action.entity, action.details);
            break;
        }
        
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error('Error processing conversation action:', error);
        results.push({ error: error instanceof Error ? error.message : 'Unknown error', action });
      }
    }
    
    return results;
  }

  // Create skill from conversation using Prisma
  private static async createSkillFromConversation(userId: string, skillName: string, details: any) {
    try {
      // First, find or create the skill
      let skill = await prisma.skill.findFirst({
        where: { name: { contains: skillName, mode: 'insensitive' } }
      });
      
      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            category: this.getSkillCategory(skillName),
            difficultyLevel: details.proficiency || 'intermediate'
          }
        });
      }
      
      // Check if user already has this skill
      const existingUserSkill = await prisma.userSkill.findFirst({
        where: {
          userId: userId,
          skillId: skill.id
        }
      });
      
      if (existingUserSkill) {
        return { type: 'skill', entity: skillName, success: false, message: 'Skill already exists' };
      }
      
      // Add skill to user's profile
      const userSkill = await prisma.userSkill.create({
        data: {
          userId: userId,
          skillId: skill.id,
          proficiencyLevel: details.proficiency || 'intermediate',
          yearsOfExperience: details.experience || 2,
          isShowcase: true
        }
      });
      
      return { type: 'skill', entity: skillName, success: true, id: userSkill.id };
    } catch (error) {
      console.error('Error creating skill:', error);
      return { type: 'skill', entity: skillName, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Create company from conversation using Prisma
  private static async createCompanyFromConversation(userId: string, companyName: string, details: any) {
    try {
      // First, find or create the company
      let company = await prisma.company.findFirst({
        where: { name: { contains: companyName, mode: 'insensitive' } }
      });
      
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: companyName,
            industry: details.industry || 'Technology',
            website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`
          }
        });
      }
      
      // Check if user already has work experience at this company
      const existingWork = await prisma.workExperience.findFirst({
        where: {
          userId: userId,
          companyId: company.id
        }
      });
      
      if (existingWork) {
        return { type: 'company', entity: companyName, success: false, message: 'Work experience already exists' };
      }
      
      // Add work experience to user's profile
      const workExperience = await prisma.workExperience.create({
        data: {
          userId: userId,
          companyId: company.id,
          title: details.role || 'Software Engineer',
          startDate: details.startDate ? new Date(details.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: details.endDate ? new Date(details.endDate) : null,
          isCurrent: details.endDate ? false : true,
          description: `${details.role || 'Software Engineer'} at ${companyName}`
        }
      });
      
      return { type: 'company', entity: companyName, success: true, id: workExperience.id };
    } catch (error) {
      console.error('Error creating company:', error);
      return { type: 'company', entity: companyName, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Create education from conversation using Prisma
  private static async createEducationFromConversation(userId: string, institutionName: string, details: any) {
    try {
      // First, find or create the institution
      let institution = await prisma.educationalInstitution.findFirst({
        where: { name: { contains: institutionName, mode: 'insensitive' } }
      });
      
      if (!institution) {
        institution = await prisma.educationalInstitution.create({
          data: {
            name: institutionName,
            type: 'University',
            country: 'United States'
          }
        });
      }
      
      // Check if user already has education at this institution
      const existingEducation = await prisma.userEducation.findFirst({
        where: {
          userId: userId,
          institutionId: institution.id
        }
      });
      
      if (existingEducation) {
        return { type: 'education', entity: institutionName, success: false, message: 'Education already exists' };
      }
      
      // Add education to user's profile
      const userEducation = await prisma.userEducation.create({
        data: {
          userId: userId,
          institutionId: institution.id,
          degree: details.degree || 'Bachelor of Science',
          fieldOfStudy: details.fieldOfStudy || 'Computer Science',
          startDate: details.startDate ? new Date(details.startDate) : new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
          endDate: details.endDate ? new Date(details.endDate) : new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000),
          gpa: details.grade || null
        }
      });
      
      return { type: 'education', entity: institutionName, success: true, id: userEducation.id };
    } catch (error) {
      console.error('Error creating education:', error);
      return { type: 'education', entity: institutionName, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Helper to categorize skills
  private static getSkillCategory(skillName: string): string {
    const skillLower = skillName.toLowerCase();
    
    if (['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php'].includes(skillLower)) {
      return 'Programming';
    } else if (['react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind'].includes(skillLower)) {
      return 'Frontend';
    } else if (['node.js', 'express', 'django', 'spring', 'laravel', 'rails'].includes(skillLower)) {
      return 'Backend';
    } else if (['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'].includes(skillLower)) {
      return 'Cloud';
    } else if (['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch'].includes(skillLower)) {
      return 'Database';
    } else {
      return 'Technical';
    }
  }
}