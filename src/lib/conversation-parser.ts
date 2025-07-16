import { GraphEventBroadcaster } from './graph-events';
import { ConversationInsights, CommitInsight } from './conversation-insights';

export interface ConversationAction {
  type: 'add_skill' | 'add_company' | 'add_education' | 'add_objective' | 'add_key_result' | 'update_profile' | 'none';
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
    // OKR-specific fields
    category?: string;
    priority?: string;
    timeframe?: string;
    targetDate?: string;
    targetValue?: number;
    unit?: string;
    measurementType?: string;
    parentObjective?: string;
  };
  commitmentInsight?: CommitInsight;
}

export interface ConversationAnalysis {
  actions: ConversationAction[];
  commitmentInsights: CommitInsight[];
  philosophicalReflection: string;
  commitmentScore: number;
  dominantCommitmentType: string;
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

    // OKR and Goal patterns
    const objectivePatterns = [
      /(?:my goal is to|i want to|i aim to|objective:|goal:|target:|my objective is to)\s+([^.!?]+)/gi,
      /(?:i'm working towards|i'm trying to|i plan to|i intend to)\s+([^.!?]+)/gi,
      /(?:by\s+(\w+\s+\d{4}|next\s+\w+|this\s+\w+)\s+i\s+want\s+to|i\s+want\s+to\s+achieve)\s+([^.!?]+)/gi
    ];

    objectivePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        const objectiveText = match[match.length - 1].trim();
        if (objectiveText.length > 3) {
          actions.push({
            type: 'add_objective',
            entity: objectiveText,
            details: {
              category: this.extractCategory(objectiveText),
              priority: this.extractPriority(input, objectiveText),
              timeframe: this.extractTimeframe(input, objectiveText),
              targetDate: this.extractTargetDate(input, objectiveText)
            }
          });
        }
      }
    });

    // Key Results patterns
    const keyResultPatterns = [
      /(?:key result|kr|measure|metric|target):\s*([^.!?]+)/gi,
      /(?:increase|decrease|improve|achieve|reach|hit|get\s+to)\s+([^.!?]+?)\s+(?:by|to)\s+(\d+(?:\.\d+)?)\s*(%|percent|users|customers|dollars?|\$|points?|hours?|days?|weeks?|months?)/gi,
      /(?:complete|finish|deliver|launch|ship)\s+([^.!?]+)/gi
    ];

    keyResultPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        if (match.length >= 2) {
          const keyResultText = match[1].trim();
          const targetValue = match[2] ? parseFloat(match[2]) : undefined;
          const unit = match[3] || '';
          
          if (keyResultText.length > 3) {
            actions.push({
              type: 'add_key_result',
              entity: keyResultText,
              details: {
                targetValue: targetValue,
                unit: unit,
                measurementType: this.extractMeasurementType(unit),
                targetDate: this.extractTargetDate(input, keyResultText)
              }
            });
          }
        }
      }
    });

    return actions;
  }

  // Enhanced parsing with commitment insights
  static parseWithCommitmentInsights(input: string): ConversationAnalysis {
    const actions = this.parseUserInput(input);
    const commitmentInsights = ConversationInsights.analyzeCommitmentPatterns(input);
    
    // Link commitment insights to actions where relevant
    actions.forEach(action => {
      const relevantInsight = commitmentInsights.find(insight => 
        insight.entity.toLowerCase().includes(action.entity.toLowerCase()) ||
        action.entity.toLowerCase().includes(insight.entity.toLowerCase())
      );
      
      if (relevantInsight) {
        action.commitmentInsight = relevantInsight;
      }
    });

    const philosophicalReflection = ConversationInsights.generateCommitmentReflection(commitmentInsights);
    const commitmentScore = this.calculateCommitmentScore(commitmentInsights);
    const dominantCommitmentType = this.getDominantCommitmentType(commitmentInsights);

    return {
      actions,
      commitmentInsights,
      philosophicalReflection,
      commitmentScore,
      dominantCommitmentType
    };
  }

  // Calculate overall commitment score (0-100)
  private static calculateCommitmentScore(insights: CommitInsight[]): number {
    if (insights.length === 0) return 0;

    const intensityWeights = {
      low: 1,
      medium: 2,
      high: 3,
      life_changing: 4
    };

    const totalScore = insights.reduce((sum, insight) => {
      return sum + intensityWeights[insight.intensity];
    }, 0);

    // Normalize to 0-100 scale
    const maxPossibleScore = insights.length * 4;
    return Math.round((totalScore / maxPossibleScore) * 100);
  }

  // Get the dominant commitment type
  private static getDominantCommitmentType(insights: CommitInsight[]): string {
    if (insights.length === 0) return 'none';

    const typeCounts = insights.reduce((counts, insight) => {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const dominantType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    const typeLabels = {
      life_commitment: 'Life Direction',
      professional_commitment: 'Career Growth',
      personal_growth: 'Self Development',
      relationship_commitment: 'Relationships',
      skill_commitment: 'Skill Mastery'
    };

    return typeLabels[dominantType as keyof typeof typeLabels] || 'Mixed';
  }

  // Generate AI response based on commitment analysis
  static generateCommitmentResponse(analysis: ConversationAnalysis): string {
    const { commitmentInsights, philosophicalReflection, commitmentScore, dominantCommitmentType } = analysis;

    if (commitmentInsights.length === 0) {
      return "I sense potential in your words. Tell me more about what you're truly committed to achieving.";
    }

    let response = `I hear ${commitmentInsights.length} commitment${commitmentInsights.length > 1 ? 's' : ''} in your words. `;
    
    if (commitmentScore >= 80) {
      response += "Your language shows deep conviction and strong intent. ";
    } else if (commitmentScore >= 60) {
      response += "There's good commitment energy here. ";
    } else {
      response += "I sense some hesitation - what would help you feel more committed? ";
    }

    if (dominantCommitmentType !== 'none') {
      response += `Your focus seems to be on ${dominantCommitmentType.toLowerCase()}. `;
    }

    // Add insight about specific commitments
    const highIntensityInsights = commitmentInsights.filter(i => i.intensity === 'high' || i.intensity === 'life_changing');
    if (highIntensityInsights.length > 0) {
      const insight = highIntensityInsights[0];
      response += `Your commitment to "${insight.entity}" particularly stands out. `;
      
      // Add a relevant question or insight
      response += this.generateCommitmentQuestion(insight);
    }

    response += " What would help you take the next step forward?";

    return response;
  }

  // Generate thoughtful questions based on commitment insights
  private static generateCommitmentQuestion(insight: CommitInsight): string {
    const questions = {
      life_commitment: [
        "What does this commitment mean for your daily choices?",
        "How will you know when you're living this commitment fully?",
        "What might try to pull you away from this path?"
      ],
      professional_commitment: [
        "What's the first concrete step you'll take tomorrow?",
        "Who could support you on this professional journey?",
        "What skills do you need to develop to achieve this?"
      ],
      personal_growth: [
        "What's been holding you back from this growth?",
        "How will you measure progress along the way?",
        "What would success look like in 6 months?"
      ],
      relationship_commitment: [
        "How will this commitment change your relationships?",
        "What do you need from others to support this?",
        "How will you maintain this commitment during difficult times?"
      ],
      skill_commitment: [
        "How will you practice this consistently?",
        "What's your plan for when you hit obstacles?",
        "How will you know when you've achieved mastery?"
      ]
    };

    const questionSet = questions[insight.type];
    return questionSet[Math.floor(Math.random() * questionSet.length)];
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
          
          // Also broadcast to WebSocket for real-time updates (skip 'none' type)
          if (action.type !== 'none') {
            await GraphEventBroadcaster.broadcastConversationUpdate(
              userId,
              action.type,
              action.entity,
              action.details
            );
          }
        }
      } catch (error) {
        console.error('Error processing conversation action:', error);
        results.push({ error: error instanceof Error ? error.message : 'Unknown error', action });
      }
    }
    
    return results;
  }

  // Create skill from conversation
  private static async createSkillFromConversation(userId: string, skillName: string, details: any) {
    try {
      // First, create or find the skill
      const skillResponse = await fetch('/api/skills/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: skillName })
      });
      
      let skillId;
      if (skillResponse.ok) {
        const skillData = await skillResponse.json();
        if (skillData.skills && skillData.skills.length > 0) {
          skillId = skillData.skills[0].id;
        } else {
          // Create new skill
          const createResponse = await fetch('/api/admin/entities/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: skillName,
              category: this.getSkillCategory(skillName),
              difficultyLevel: details.proficiency || 'intermediate'
            })
          });
          
          if (createResponse.ok) {
            const newSkill = await createResponse.json();
            skillId = newSkill.id;
          }
        }
      }
      
      if (!skillId) {
        // Use a test skill ID as fallback
        skillId = `test-skill-${Date.now()}`;
      }
      
      // Add skill to user's profile
      const userSkillResponse = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: [{
            skillId: skillId,
            proficiencyLevel: details.proficiency || 'intermediate',
            yearsOfExperience: details.experience || 2,
            isShowcase: true
          }]
        })
      });
      
      if (userSkillResponse.ok) {
        return { type: 'skill', entity: skillName, success: true };
      }
    } catch (error) {
      console.error('Error creating skill:', error);
    }
    
    return { type: 'skill', entity: skillName, success: false };
  }

  // Create company from conversation
  private static async createCompanyFromConversation(userId: string, companyName: string, details: any) {
    try {
      // First, create or find the company
      const companyResponse = await fetch('/api/companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: companyName })
      });
      
      let companyId;
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.companies && companyData.companies.length > 0) {
          companyId = companyData.companies[0].id;
        } else {
          // Create new company
          const createResponse = await fetch('/api/admin/entities/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: companyName,
              industry: details.industry || 'Technology',
              website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`
            })
          });
          
          if (createResponse.ok) {
            const newCompany = await createResponse.json();
            companyId = newCompany.id;
          }
        }
      }
      
      if (!companyId) {
        // Use a test company ID as fallback
        companyId = `test-company-${Date.now()}`;
      }
      
      // Add work experience to user's profile
      const workResponse = await fetch('/api/profile/work-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workExperiences: [{
            companyId: companyId,
            companyName: companyName,
            position: details.role || 'Software Engineer',
            startDate: details.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: details.endDate || null,
            isCurrentRole: details.endDate ? false : true,
            description: `${details.role || 'Software Engineer'} at ${companyName}`
          }]
        })
      });
      
      if (workResponse.ok) {
        return { type: 'company', entity: companyName, success: true };
      }
    } catch (error) {
      console.error('Error creating company:', error);
    }
    
    return { type: 'company', entity: companyName, success: false };
  }

  // Create education from conversation
  private static async createEducationFromConversation(userId: string, institutionName: string, details: any) {
    try {
      // First, create or find the institution
      const institutionResponse = await fetch('/api/education/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: institutionName })
      });
      
      let institutionId;
      if (institutionResponse.ok) {
        const institutionData = await institutionResponse.json();
        if (institutionData.institutions && institutionData.institutions.length > 0) {
          institutionId = institutionData.institutions[0].id;
        } else {
          // Create new institution
          const createResponse = await fetch('/api/admin/entities/education', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: institutionName,
              type: 'University',
              country: 'United States'
            })
          });
          
          if (createResponse.ok) {
            const newInstitution = await createResponse.json();
            institutionId = newInstitution.id;
          }
        }
      }
      
      if (!institutionId) {
        // Use a test institution ID as fallback
        institutionId = `test-institution-${Date.now()}`;
      }
      
      // Add education to user's profile
      const educationResponse = await fetch('/api/profile/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educations: [{
            institutionId: institutionId,
            degree: details.degree || 'Bachelor of Science',
            fieldOfStudy: details.fieldOfStudy || 'Computer Science',
            startDate: details.startDate || new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: details.endDate || new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            grade: details.grade || null
          }]
        })
      });
      
      if (educationResponse.ok) {
        return { type: 'education', entity: institutionName, success: true };
      }
    } catch (error) {
      console.error('Error creating education:', error);
    }
    
    return { type: 'education', entity: institutionName, success: false };
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

  // Extract category from objective text
  private static extractCategory(objectiveText: string): string {
    const lowerText = objectiveText.toLowerCase();
    
    if (lowerText.includes('learn') || lowerText.includes('study') || lowerText.includes('course') || lowerText.includes('skill')) {
      return 'learning';
    } else if (lowerText.includes('career') || lowerText.includes('job') || lowerText.includes('work') || lowerText.includes('promotion')) {
      return 'professional';
    } else if (lowerText.includes('health') || lowerText.includes('fitness') || lowerText.includes('exercise')) {
      return 'health';
    } else if (lowerText.includes('personal') || lowerText.includes('family') || lowerText.includes('relationship')) {
      return 'personal';
    }
    
    return 'professional'; // default
  }

  // Extract priority from context
  private static extractPriority(input: string, objectiveText: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('urgent') || lowerInput.includes('critical') || lowerInput.includes('important') || lowerInput.includes('high priority')) {
      return 'high';
    } else if (lowerInput.includes('medium') || lowerInput.includes('moderate')) {
      return 'medium';
    } else if (lowerInput.includes('low') || lowerInput.includes('when i have time') || lowerInput.includes('eventually')) {
      return 'low';
    }
    
    return 'medium'; // default
  }

  // Extract timeframe from context
  private static extractTimeframe(input: string, objectiveText: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('quarter') || lowerInput.includes('q1') || lowerInput.includes('q2') || lowerInput.includes('q3') || lowerInput.includes('q4')) {
      return 'quarter';
    } else if (lowerInput.includes('year') || lowerInput.includes('annual') || lowerInput.includes('2024') || lowerInput.includes('2025')) {
      return 'year';
    } else if (lowerInput.includes('month') || lowerInput.includes('30 days') || lowerInput.includes('this month') || lowerInput.includes('next month')) {
      return 'month';
    } else if (lowerInput.includes('ongoing') || lowerInput.includes('continuous') || lowerInput.includes('long term')) {
      return 'ongoing';
    }
    
    return 'quarter'; // default
  }

  // Extract target date from context
  private static extractTargetDate(input: string, text: string): string | undefined {
    const lowerInput = input.toLowerCase();
    
    // Look for specific dates or time periods
    const datePatterns = [
      /by\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi,
      /by\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      /by\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /by\s+the\s+end\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
      /by\s+next\s+(week|month|quarter|year)/gi,
      /within\s+(\d+)\s+(days?|weeks?|months?)/gi
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(input);
      if (match) {
        return match[0]; // Return the matched date string for parsing later
      }
    }

    return undefined;
  }

  // Extract measurement type from unit
  private static extractMeasurementType(unit: string): string {
    if (unit.includes('%') || unit.includes('percent')) {
      return 'percentage';
    } else if (unit.includes('$') || unit.includes('dollar')) {
      return 'currency';
    } else if (unit.match(/\d/)) {
      return 'number';
    } else if (unit.includes('yes') || unit.includes('no') || unit.includes('done') || unit.includes('complete')) {
      return 'boolean';
    }
    
    return 'number'; // default
  }

  // Quick test method for conversation parsing
  static testParsing() {
    const testInputs = [
      "I'm skilled in JavaScript and React, and I work at Meta as a Senior Developer",
      "I have 5 years of experience with Python and I'm an expert in machine learning",
      "I studied Computer Science at MIT and got my Masters from Stanford",
      "I worked at Google for 3 years as a Software Engineer in the AI team",
      "My skills include Java, Spring Boot, and I'm proficient in AWS cloud services",
      "My goal is to become a senior developer by the end of this year",
      "I want to achieve 10,000 users by next quarter",
      "Key result: increase revenue by 25% this quarter"
    ];
    
    testInputs.forEach(input => {
      console.log(`\nInput: "${input}"`);
      const actions = this.parseUserInput(input);
      console.log('Parsed actions:', actions);
    });
  }
}