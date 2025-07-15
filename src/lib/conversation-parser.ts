import { GraphEventBroadcaster } from './graph-events';

export interface ConversationAction {
  type: 'add_skill' | 'add_company' | 'add_education' | 'update_profile' | 'none';
  entity: string;
  details: {
    proficiency?: string;
    experience?: number;
    role?: string;
    industry?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  };
}

export class ConversationParser {
  
  // Parse user input for actionable graph updates
  static parseUserInput(input: string): ConversationAction[] {
    const actions: ConversationAction[] = [];
    const lowerInput = input.toLowerCase();

    // Skill patterns
    const skillPatterns = [
      /(?:i know|i can|i'm good at|i have experience with|i've worked with|i use|i'm skilled in|add skill|learned|skilled in)\s+([a-z0-9\s\-\+\.]+)/gi,
      /(?:my skills include|skills:\s*)([a-z0-9\s\-\+\.,]+)/gi,
      /(?:proficient in|expert in|advanced in|beginner in)\s+([a-z0-9\s\-\+\.]+)/gi
    ];

    // Company patterns
    const companyPatterns = [
      /(?:i work at|i worked at|i'm at|employed at|job at|company|worked for)\s+([a-z0-9\s\-\&\.]+)/gi,
      /(?:my current role is|i'm a|i work as)\s+([a-z\s]+)\s+(?:at|for)\s+([a-z0-9\s\-\&\.]+)/gi
    ];

    // Education patterns
    const educationPatterns = [
      /(?:i studied|i graduated from|i went to|degree from|attended|studied at)\s+([a-z0-9\s\-\&\.]+)/gi,
      /(?:i have a|i got my|i earned my)\s+([a-z\s]+)\s+(?:from|at)\s+([a-z0-9\s\-\&\.]+)/gi
    ];

    // Extract skills
    skillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        const skills = match[1].split(/[,\s]+/).filter(skill => 
          skill.trim().length > 1 && 
          !['and', 'or', 'with', 'in', 'at', 'for', 'the', 'a', 'an'].includes(skill.trim().toLowerCase())
        );
        
        skills.forEach(skill => {
          const cleanSkill = skill.trim().replace(/[^\w\s\-\+\.]/g, '');
          if (cleanSkill.length > 1) {
            actions.push({
              type: 'add_skill',
              entity: cleanSkill,
              details: {
                proficiency: this.extractProficiency(lowerInput, cleanSkill),
                experience: this.extractExperience(lowerInput, cleanSkill)
              }
            });
          }
        });
      }
    });

    // Extract companies
    companyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        if (match.length === 2) {
          // Simple company mention
          const company = match[1].trim().replace(/[^\w\s\-\&\.]/g, '');
          if (company.length > 1) {
            actions.push({
              type: 'add_company',
              entity: company,
              details: {
                industry: this.extractIndustry(lowerInput, company)
              }
            });
          }
        } else if (match.length === 3) {
          // Role + company
          const role = match[1].trim();
          const company = match[2].trim().replace(/[^\w\s\-\&\.]/g, '');
          if (company.length > 1) {
            actions.push({
              type: 'add_company',
              entity: company,
              details: {
                role: role,
                industry: this.extractIndustry(lowerInput, company)
              }
            });
          }
        }
      }
    });

    // Extract education
    educationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        if (match.length === 2) {
          // Simple institution mention
          const institution = match[1].trim().replace(/[^\w\s\-\&\.]/g, '');
          if (institution.length > 1) {
            actions.push({
              type: 'add_education',
              entity: institution,
              details: {}
            });
          }
        } else if (match.length === 3) {
          // Degree + institution
          const degree = match[1].trim();
          const institution = match[2].trim().replace(/[^\w\s\-\&\.]/g, '');
          if (institution.length > 1) {
            actions.push({
              type: 'add_education',
              entity: institution,
              details: {
                degree: degree
              }
            });
          }
        }
      }
    });

    return actions;
  }

  // Extract proficiency level from context
  private static extractProficiency(input: string, skill: string): string {
    const skillLower = skill.toLowerCase();
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes(`expert in ${skillLower}`) || inputLower.includes(`${skillLower} expert`)) {
      return 'expert';
    } else if (inputLower.includes(`advanced in ${skillLower}`) || inputLower.includes(`${skillLower} advanced`)) {
      return 'advanced';
    } else if (inputLower.includes(`beginner in ${skillLower}`) || inputLower.includes(`${skillLower} beginner`)) {
      return 'beginner';
    } else if (inputLower.includes(`good at ${skillLower}`) || inputLower.includes(`proficient in ${skillLower}`)) {
      return 'intermediate';
    }
    
    return 'intermediate'; // default
  }

  // Extract years of experience from context
  private static extractExperience(input: string, skill: string): number {
    const skillLower = skill.toLowerCase();
    const inputLower = input.toLowerCase();
    
    const yearPatterns = [
      new RegExp(`${skillLower}.*?(\\d+)\\s*year`, 'i'),
      new RegExp(`(\\d+)\\s*year.*?${skillLower}`, 'i'),
      new RegExp(`${skillLower}.*?(\\d+)\\s*yr`, 'i'),
      new RegExp(`(\\d+)\\s*yr.*?${skillLower}`, 'i')
    ];
    
    for (const pattern of yearPatterns) {
      const match = pattern.exec(inputLower);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return 2; // default
  }

  // Extract industry from context
  private static extractIndustry(input: string, company: string): string | undefined {
    const industryKeywords = {
      'technology': ['tech', 'software', 'app', 'digital', 'ai', 'machine learning', 'data'],
      'finance': ['bank', 'finance', 'trading', 'investment', 'fintech'],
      'healthcare': ['health', 'medical', 'hospital', 'pharma', 'biotech'],
      'education': ['school', 'university', 'education', 'learning', 'academic'],
      'retail': ['shop', 'store', 'retail', 'commerce', 'sales'],
      'consulting': ['consulting', 'advisory', 'strategy', 'consulting'],
      'media': ['media', 'news', 'publishing', 'entertainment', 'content']
    };
    
    const inputLower = input.toLowerCase();
    const companyLower = company.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => inputLower.includes(keyword) || companyLower.includes(keyword))) {
        return industry;
      }
    }
    
    return undefined;
  }

  // Process conversation actions and trigger graph updates
  static async processConversationActions(userId: string, actions: ConversationAction[]) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'add_skill':
            await GraphEventBroadcaster.broadcastConversationUpdate(
              userId,
              'add_skill',
              action.entity,
              action.details
            );
            break;
            
          case 'add_company':
            await GraphEventBroadcaster.broadcastConversationUpdate(
              userId,
              'add_company',
              action.entity,
              action.details
            );
            break;
            
          case 'add_education':
            await GraphEventBroadcaster.broadcastConversationUpdate(
              userId,
              'add_education',
              action.entity,
              action.details
            );
            break;
        }
      } catch (error) {
        console.error('Error processing conversation action:', error);
      }
    }
  }

  // Quick test method for conversation parsing
  static testParsing() {
    const testInputs = [
      "I'm skilled in JavaScript and React, and I work at Meta as a Senior Developer",
      "I have 5 years of experience with Python and I'm an expert in machine learning",
      "I studied Computer Science at MIT and got my Masters from Stanford",
      "I worked at Google for 3 years as a Software Engineer in the AI team",
      "My skills include Java, Spring Boot, and I'm proficient in AWS cloud services"
    ];
    
    testInputs.forEach(input => {
      console.log(`\nInput: "${input}"`);
      const actions = this.parseUserInput(input);
      console.log('Parsed actions:', actions);
    });
  }
}