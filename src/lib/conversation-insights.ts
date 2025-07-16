// Conversation Insights - Understanding the philosophy of commits in life

export interface CommitInsight {
  type: 'life_commitment' | 'professional_commitment' | 'personal_growth' | 'relationship_commitment' | 'skill_commitment';
  intensity: 'low' | 'medium' | 'high' | 'life_changing';
  timeframe: 'immediate' | 'short_term' | 'long_term' | 'lifelong';
  category: string;
  entity: string;
  commitment_statement: string;
  philosophical_significance: string;
  actionable_steps: string[];
  commitment_indicators: string[];
  risk_factors: string[];
  success_metrics: string[];
}

export class ConversationInsights {
  // Detect commitment patterns in conversation
  static analyzeCommitmentPatterns(text: string): CommitInsight[] {
    const insights: CommitInsight[] = [];
    const lowercaseText = text.toLowerCase();

    // Life commitment patterns
    const lifeCommitmentPatterns = [
      /i want to become/gi,
      /i'm dedicated to/gi,
      /i will always/gi,
      /my life's purpose/gi,
      /i'm committed to/gi,
      /i pledge to/gi,
      /i promise to/gi,
      /i've decided to/gi,
      /i will never give up on/gi,
      /this is my calling/gi
    ];

    // Professional commitment patterns
    const professionalPatterns = [
      /i want to work at/gi,
      /i'm pursuing a career in/gi,
      /i will master/gi,
      /i'm building expertise in/gi,
      /i want to lead/gi,
      /i will become an expert in/gi,
      /i'm transitioning to/gi,
      /i will achieve/gi
    ];

    // Personal growth patterns
    const growthPatterns = [
      /i want to improve/gi,
      /i need to work on/gi,
      /i will develop/gi,
      /i must overcome/gi,
      /i will learn/gi,
      /i will change/gi,
      /i want to be better at/gi,
      /i'm working on myself/gi
    ];

    // Relationship commitment patterns
    const relationshipPatterns = [
      /i will support/gi,
      /i want to be there for/gi,
      /i will maintain/gi,
      /i care about/gi,
      /i will prioritize/gi,
      /i want to connect with/gi,
      /i will be present for/gi
    ];

    // Skill commitment patterns
    const skillPatterns = [
      /i will practice/gi,
      /i will study/gi,
      /i will train/gi,
      /i will perfect/gi,
      /i will hone/gi,
      /i will develop my skills in/gi,
      /i will become proficient in/gi
    ];

    // Analyze each pattern type
    this.analyzePatternType(text, lifeCommitmentPatterns, 'life_commitment', insights);
    this.analyzePatternType(text, professionalPatterns, 'professional_commitment', insights);
    this.analyzePatternType(text, growthPatterns, 'personal_growth', insights);
    this.analyzePatternType(text, relationshipPatterns, 'relationship_commitment', insights);
    this.analyzePatternType(text, skillPatterns, 'skill_commitment', insights);

    return insights;
  }

  private static analyzePatternType(
    text: string, 
    patterns: RegExp[], 
    type: CommitInsight['type'], 
    insights: CommitInsight[]
  ) {
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const context = this.getContextAroundMatch(text, match);
          const insight = this.generateCommitInsight(match, context, type);
          if (insight) {
            insights.push(insight);
          }
        });
      }
    });
  }

  private static getContextAroundMatch(text: string, match: string): string {
    const index = text.indexOf(match);
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + match.length + 50);
    return text.substring(start, end);
  }

  private static generateCommitInsight(
    match: string, 
    context: string, 
    type: CommitInsight['type']
  ): CommitInsight | null {
    // Extract the entity/subject of the commitment
    const entity = this.extractCommitmentEntity(context, match);
    if (!entity) return null;

    // Determine intensity based on language used
    const intensity = this.determineCommitmentIntensity(context);
    
    // Determine timeframe
    const timeframe = this.determineTimeframe(context);

    // Generate philosophical significance
    const philosophicalSignificance = this.generatePhilosophicalSignificance(type, entity, context);

    // Generate actionable steps
    const actionableSteps = this.generateActionableSteps(type, entity);

    // Generate commitment indicators
    const commitmentIndicators = this.generateCommitmentIndicators(context);

    // Generate risk factors
    const riskFactors = this.generateRiskFactors(type, entity);

    // Generate success metrics
    const successMetrics = this.generateSuccessMetrics(type, entity);

    return {
      type,
      intensity,
      timeframe,
      category: this.getCategoryFromType(type),
      entity,
      commitment_statement: match + ' ' + entity,
      philosophical_significance: philosophicalSignificance,
      actionable_steps: actionableSteps,
      commitment_indicators: commitmentIndicators,
      risk_factors: riskFactors,
      success_metrics: successMetrics
    };
  }

  private static extractCommitmentEntity(context: string, match: string): string | null {
    // Extract what comes after the commitment phrase
    const matchIndex = context.indexOf(match);
    if (matchIndex === -1) return null;

    const afterMatch = context.substring(matchIndex + match.length).trim();
    
    // Extract up to next punctuation or sentence boundary
    const entityMatch = afterMatch.match(/^([^.!?;,]+)/);
    return entityMatch ? entityMatch[1].trim() : null;
  }

  private static determineCommitmentIntensity(context: string): CommitInsight['intensity'] {
    const highIntensityWords = ['never', 'always', 'forever', 'completely', 'absolutely', 'totally', 'life-changing', 'transformative'];
    const mediumIntensityWords = ['will', 'must', 'need to', 'committed', 'dedicated', 'determined'];
    const lowIntensityWords = ['want', 'hope', 'try', 'might', 'could', 'should'];

    const lowerContext = context.toLowerCase();
    
    if (highIntensityWords.some(word => lowerContext.includes(word))) {
      return 'life_changing';
    } else if (mediumIntensityWords.some(word => lowerContext.includes(word))) {
      return 'high';
    } else if (lowerContext.includes('will') || lowerContext.includes('committed')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private static determineTimeframe(context: string): CommitInsight['timeframe'] {
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('forever') || lowerContext.includes('always') || lowerContext.includes('life')) {
      return 'lifelong';
    } else if (lowerContext.includes('years') || lowerContext.includes('long-term') || lowerContext.includes('career')) {
      return 'long_term';
    } else if (lowerContext.includes('months') || lowerContext.includes('short-term')) {
      return 'short_term';
    } else {
      return 'immediate';
    }
  }

  private static generatePhilosophicalSignificance(
    type: CommitInsight['type'], 
    entity: string, 
    context: string
  ): string {
    const significanceMap = {
      life_commitment: `This represents a fundamental life direction that shapes identity and purpose. Committing to "${entity}" is a declaration of values and a choice about who you want to become.`,
      professional_commitment: `This professional commitment to "${entity}" reflects your dedication to craft mastery and contribution to society. It's about building competence and creating value through your work.`,
      personal_growth: `This growth commitment to "${entity}" represents self-actualization and the courage to evolve. It's about becoming the best version of yourself and overcoming limitations.`,
      relationship_commitment: `This relational commitment to "${entity}" embodies the human need for connection and the willingness to invest in others. It's about building meaningful bonds and mutual support.`,
      skill_commitment: `This skill commitment to "${entity}" represents the pursuit of mastery and the dedication to continuous improvement. It's about developing competence and expanding capabilities.`
    };

    return significanceMap[type];
  }

  private static generateActionableSteps(type: CommitInsight['type'], entity: string): string[] {
    const stepsMap = {
      life_commitment: [
        `Define what success looks like for "${entity}"`,
        'Create a personal mission statement',
        'Identify daily practices that align with this commitment',
        'Set up accountability systems',
        'Review and adjust regularly'
      ],
      professional_commitment: [
        `Research the path to achieving "${entity}"`,
        'Identify required skills and knowledge',
        'Network with professionals in the field',
        'Create a professional development plan',
        'Seek mentorship and guidance'
      ],
      personal_growth: [
        `Assess current state regarding "${entity}"`,
        'Set specific, measurable goals',
        'Identify resources and support systems',
        'Create a practice schedule',
        'Track progress and celebrate milestones'
      ],
      relationship_commitment: [
        `Prioritize time and energy for "${entity}"`,
        'Communicate your commitment clearly',
        'Develop emotional intelligence',
        'Practice active listening',
        'Invest in shared experiences'
      ],
      skill_commitment: [
        `Practice "${entity}" consistently`,
        'Seek feedback from experts',
        'Study best practices and techniques',
        'Join communities of practice',
        'Apply skills in real-world scenarios'
      ]
    };

    return stepsMap[type];
  }

  private static generateCommitmentIndicators(context: string): string[] {
    const indicators = [];
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes('will') || lowerContext.includes('committed')) {
      indicators.push('Strong verbal commitment expressed');
    }
    if (lowerContext.includes('always') || lowerContext.includes('never')) {
      indicators.push('Absolute language used, indicating high conviction');
    }
    if (lowerContext.includes('need') || lowerContext.includes('must')) {
      indicators.push('Necessity-based motivation detected');
    }
    if (lowerContext.includes('want') || lowerContext.includes('desire')) {
      indicators.push('Desire-driven motivation present');
    }
    if (lowerContext.includes('decided') || lowerContext.includes('choice')) {
      indicators.push('Conscious decision-making evident');
    }

    return indicators.length > 0 ? indicators : ['Commitment pattern detected in conversation'];
  }

  private static generateRiskFactors(type: CommitInsight['type'], entity: string): string[] {
    const riskMap = {
      life_commitment: [
        'May be too broad or vague to execute',
        'Could conflict with other life priorities',
        'Risk of burnout from over-commitment',
        'May evolve as life circumstances change'
      ],
      professional_commitment: [
        'Industry changes may affect relevance',
        'Requires significant time investment',
        'May face competition and setbacks',
        'Balancing with personal life challenges'
      ],
      personal_growth: [
        'Progress may be slow and non-linear',
        'Requires consistent self-discipline',
        'May face internal resistance to change',
        'Difficult to measure progress objectively'
      ],
      relationship_commitment: [
        'Requires mutual investment from others',
        'May face conflicts and disagreements',
        'Time and energy constraints',
        'Relationships naturally evolve over time'
      ],
      skill_commitment: [
        'Requires sustained practice and effort',
        'May plateau at intermediate levels',
        'Competing priorities may interfere',
        'Skill may become obsolete over time'
      ]
    };

    return riskMap[type];
  }

  private static generateSuccessMetrics(type: CommitInsight['type'], entity: string): string[] {
    const metricsMap = {
      life_commitment: [
        'Alignment between daily actions and stated values',
        'Progress toward long-term life goals',
        'Sense of fulfillment and purpose',
        'Consistency in choices and behaviors'
      ],
      professional_commitment: [
        'Skill development and competency growth',
        'Career advancement opportunities',
        'Recognition from peers and industry',
        'Contribution to meaningful projects'
      ],
      personal_growth: [
        'Self-awareness and emotional intelligence',
        'Improved relationships and communication',
        'Increased resilience and adaptability',
        'Achievement of personal milestones'
      ],
      relationship_commitment: [
        'Depth and quality of connections',
        'Mutual support and trust levels',
        'Shared experiences and memories',
        'Positive impact on others\' lives'
      ],
      skill_commitment: [
        'Measurable improvement in ability',
        'Application of skills in real scenarios',
        'Recognition of expertise by others',
        'Ability to teach or mentor others'
      ]
    };

    return metricsMap[type];
  }

  private static getCategoryFromType(type: CommitInsight['type']): string {
    const categoryMap = {
      life_commitment: 'Life Direction',
      professional_commitment: 'Career Development',
      personal_growth: 'Self Improvement',
      relationship_commitment: 'Relationships',
      skill_commitment: 'Skill Development'
    };

    return categoryMap[type];
  }

  // Generate philosophical reflection on commitment
  static generateCommitmentReflection(insights: CommitInsight[]): string {
    if (insights.length === 0) {
      return "Every conversation contains seeds of commitment. The words we choose reveal the directions we want to grow.";
    }

    const highIntensityCount = insights.filter(i => i.intensity === 'high' || i.intensity === 'life_changing').length;
    const commitmentTypes = [...new Set(insights.map(i => i.type))];

    let reflection = "Your words reveal deep currents of commitment. ";

    if (highIntensityCount > 0) {
      reflection += `${highIntensityCount} high-intensity commitments detected - these are the declarations that shape destiny. `;
    }

    if (commitmentTypes.length > 2) {
      reflection += "The diversity of your commitments shows a holistic approach to growth - professional, personal, and relational development are all interconnected. ";
    }

    reflection += "Remember: commitment is not just about the destination, but about who you become on the journey. Each commitment is a choice to become more than you are today.";

    return reflection;
  }
}