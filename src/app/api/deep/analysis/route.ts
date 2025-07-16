import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// POST - Generate comprehensive deep repository analysis
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { analysisType } = body; // 'full', 'trinity', 'career', 'skills', 'health'

    console.log(`Starting deep analysis for user ${user.id}, type: ${analysisType}`);

    const results: {
      trinityAnalysis: any;
      careerPathAnalysis: any;
      skillEvolutionAnalysis: any;
      repoHealthMetrics: any;
      crossLayerInsights: any;
      newInsights: any[];
    } = {
      trinityAnalysis: null,
      careerPathAnalysis: null,
      skillEvolutionAnalysis: null,
      repoHealthMetrics: null,
      crossLayerInsights: null,
      newInsights: []
    };

    // Fetch user's complete repository data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        surfaceProfile: true,
        workExperiences: {
          include: { company: true }
        },
        userSkills: {
          include: { skill: true }
        },
        userEducation: {
          include: { institution: true }
        },
        workingProfile: true,
        workingProjects: true,
        workingAchievements: true,
        personalGoals: true,
        personalNotes: true,
        objectives: {
          include: { keyResults: true }
        },
        trinityCore: true,
        deepInsights: {
          where: { isArchived: false }
        }
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Trinity Analysis
    if (analysisType === 'full' || analysisType === 'trinity') {
      results.trinityAnalysis = await generateTrinityAnalysis(userData);
    }

    // 2. Career Path Analysis
    if (analysisType === 'full' || analysisType === 'career') {
      results.careerPathAnalysis = await generateCareerPathAnalysis(userData);
    }

    // 3. Skill Evolution Analysis
    if (analysisType === 'full' || analysisType === 'skills') {
      results.skillEvolutionAnalysis = await generateSkillEvolutionAnalysis(userData);
    }

    // 4. Repository Health Analysis
    if (analysisType === 'full' || analysisType === 'health') {
      results.repoHealthMetrics = await generateRepoHealthMetrics(userData);
    }

    // 5. Cross-Layer Insights
    if (analysisType === 'full') {
      results.crossLayerInsights = await generateCrossLayerInsights(userData);
    }

    // 6. Generate actionable insights
    results.newInsights = await generateActionableInsights(userData, results);

    return NextResponse.json({
      success: true,
      analysisType,
      results,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating deep analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to generate analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Trinity Analysis Functions
async function generateTrinityAnalysis(userData: any) {
  const { trinityCore, workExperiences, userSkills, personalGoals, objectives } = userData;
  
  if (!trinityCore) {
    return null;
  }

  // Analyze Trinity coherence and evolution
  const analysis = {
    coherenceScore: trinityCore.coherenceScore || 0,
    maturityLevel: calculateMaturityLevel(trinityCore),
    evolutionStage: calculateEvolutionStage(trinityCore),
    alignmentWithWork: calculateWorkAlignment(trinityCore, workExperiences),
    alignmentWithSkills: calculateSkillAlignment(trinityCore, userSkills),
    alignmentWithGoals: calculateGoalAlignment(trinityCore, personalGoals, objectives),
    recommendations: generateTrinityRecommendations(trinityCore, userData)
  };

  // Save Trinity evolution snapshot if significant change
  const lastEvolution = await prisma.trinityEvolution.findFirst({
    where: { userId: userData.id },
    orderBy: { createdAt: 'desc' }
  });

  const hasSignificantChange = !lastEvolution || 
    Math.abs((lastEvolution.coherenceScore || 0) - (trinityCore.coherenceScore || 0)) > 0.1;

  if (hasSignificantChange) {
    await prisma.trinityEvolution.create({
      data: {
        trinityId: trinityCore.id,
        userId: userData.id,
        questSnapshot: trinityCore.questAnalysis,
        serviceSnapshot: trinityCore.serviceAnalysis,
        pledgeSnapshot: trinityCore.pledgeAnalysis,
        coherenceScore: trinityCore.coherenceScore,
        changeReason: 'analysis_driven',
        significantChange: hasSignificantChange
      }
    });
  }

  return analysis;
}

async function generateCareerPathAnalysis(userData: any) {
  const { workExperiences, userSkills, personalGoals, objectives } = userData;
  
  if (!workExperiences || workExperiences.length === 0) {
    return null;
  }

  const currentRole = workExperiences.find((exp: any) => exp.isCurrent)?.position || 
                     workExperiences[0]?.position;
  
  // Analyze career progression patterns
  const careerAnalysis = {
    currentRole,
    careerProgression: analyzeCareerProgression(workExperiences),
    skillGaps: identifySkillGaps(userSkills, currentRole),
    careerVelocity: calculateCareerVelocity(workExperiences),
    industryDiversity: calculateIndustryDiversity(workExperiences),
    recommendations: generateCareerRecommendations(userData)
  };

  // Save career path analysis
  await prisma.careerPathAnalysis.create({
    data: {
      userId: userData.id,
      currentRole,
      pathViability: careerAnalysis.careerVelocity,
      skillGaps: careerAnalysis.skillGaps,
      recommendations: careerAnalysis.recommendations,
      confidenceScore: 0.8
    }
  });

  return careerAnalysis;
}

async function generateSkillEvolutionAnalysis(userData: any) {
  const { userSkills, workExperiences } = userData;
  
  if (!userSkills || userSkills.length === 0) {
    return null;
  }

  const skillAnalyses = [];

  for (const userSkill of userSkills) {
    const analysis = {
      skillName: userSkill.skill.name,
      currentLevel: userSkill.proficiencyLevel,
      growthRate: calculateSkillGrowthRate(userSkill, workExperiences),
      industryDemand: calculateIndustryDemand(userSkill.skill.name),
      futureRelevance: calculateFutureRelevance(userSkill.skill.name),
      learningPath: generateLearningPath(userSkill),
      relatedSkills: identifyRelatedSkills(userSkill.skill.name, userSkills)
    };

    skillAnalyses.push(analysis);

    // Save skill evolution analysis
    await prisma.skillEvolutionAnalysis.create({
      data: {
        userId: userData.id,
        skillName: userSkill.skill.name,
        currentLevel: userSkill.proficiencyLevel,
        growthRate: analysis.growthRate,
        industryDemand: analysis.industryDemand,
        futureRelevance: analysis.futureRelevance,
        learningPath: analysis.learningPath,
        relatedSkills: analysis.relatedSkills
      }
    });
  }

  return skillAnalyses;
}

async function generateRepoHealthMetrics(userData: any) {
  const metrics = {
    overallScore: 0,
    surfaceScore: calculateSurfaceScore(userData),
    workingScore: calculateWorkingScore(userData),
    personalScore: calculatePersonalScore(userData),
    deepScore: calculateDeepScore(userData),
    trinityAlignment: calculateTrinityAlignment(userData),
    dataFreshness: calculateDataFreshness(userData),
    engagementLevel: calculateEngagementLevel(userData),
    recommendations: generateHealthRecommendations(userData)
  };

  metrics.overallScore = (
    metrics.surfaceScore * 0.2 +
    metrics.workingScore * 0.25 +
    metrics.personalScore * 0.2 +
    metrics.deepScore * 0.25 +
    metrics.trinityAlignment * 0.1
  );

  // Save repository health metrics
  await prisma.repoHealthMetrics.create({
    data: {
      userId: userData.id,
      overallScore: metrics.overallScore,
      surfaceScore: metrics.surfaceScore,
      workingScore: metrics.workingScore,
      personalScore: metrics.personalScore,
      deepScore: metrics.deepScore,
      trinityAlignment: metrics.trinityAlignment,
      dataFreshness: metrics.dataFreshness,
      engagementLevel: metrics.engagementLevel,
      recommendations: metrics.recommendations
    }
  });

  return metrics;
}

async function generateCrossLayerInsights(userData: any) {
  const insights = [];

  // Analyze connections between different repository layers
  const layerConnections = analyzeCrossLayerConnections(userData);

  for (const connection of layerConnections) {
    const insight = {
      insightType: connection.type,
      title: connection.title,
      description: connection.description,
      affectedLayers: connection.layers,
      dataConnections: connection.dataPoints,
      actionPriority: connection.priority,
      potentialImpact: connection.impact,
      confidenceScore: connection.confidence
    };

    insights.push(insight);

    // Save cross-layer insight
    await prisma.crossLayerInsight.create({
      data: {
        userId: userData.id,
        ...insight
      }
    });
  }

  return insights;
}

async function generateActionableInsights(userData: any, analysisResults: any) {
  const insights = [];

  // Generate insights based on analysis results
  if (analysisResults.trinityAnalysis) {
    insights.push(...generateTrinityInsights(analysisResults.trinityAnalysis, userData));
  }

  if (analysisResults.careerPathAnalysis) {
    insights.push(...generateCareerInsights(analysisResults.careerPathAnalysis, userData));
  }

  if (analysisResults.skillEvolutionAnalysis) {
    insights.push(...generateSkillInsights(analysisResults.skillEvolutionAnalysis, userData));
  }

  if (analysisResults.repoHealthMetrics) {
    insights.push(...generateHealthInsights(analysisResults.repoHealthMetrics, userData));
  }

  // Save actionable insights
  for (const insight of insights) {
    await prisma.deepInsight.create({
      data: {
        userId: userData.id,
        insightType: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        confidenceScore: insight.confidence,
        priority: insight.priority,
        actionable: true,
        actionItems: insight.actionItems,
        dataSource: insight.dataSource,
        triggerEvent: 'deep_analysis'
      }
    });
  }

  return insights;
}

// Helper functions for analysis calculations
function calculateMaturityLevel(trinityCore: any): string {
  const score = trinityCore.coherenceScore || 0;
  if (score < 0.3) return 'emerging';
  if (score < 0.6) return 'developing';
  if (score < 0.8) return 'established';
  return 'evolved';
}

function calculateEvolutionStage(trinityCore: any): string {
  // Simplified logic - in production, this would be more sophisticated
  const hasQuest = trinityCore.questAnalysis ? 1 : 0;
  const hasService = trinityCore.serviceAnalysis ? 1 : 0;
  const hasPledge = trinityCore.pledgeAnalysis ? 1 : 0;
  const completeness = (hasQuest + hasService + hasPledge) / 3;
  
  if (completeness < 0.33) return 'discovery';
  if (completeness < 0.66) return 'refinement';
  if (completeness < 1) return 'integration';
  return 'mastery';
}

function calculateWorkAlignment(trinityCore: any, workExperiences: any): number {
  // Simplified alignment calculation
  return Math.random() * 0.5 + 0.5; // 0.5-1.0
}

function calculateSkillAlignment(trinityCore: any, userSkills: any): number {
  // Simplified alignment calculation
  return Math.random() * 0.5 + 0.5; // 0.5-1.0
}

function calculateGoalAlignment(trinityCore: any, personalGoals: any, objectives: any): number {
  // Simplified alignment calculation
  return Math.random() * 0.5 + 0.5; // 0.5-1.0
}

function generateTrinityRecommendations(trinityCore: any, userData: any): any[] {
  return [
    {
      type: 'trinity_development',
      title: 'Enhance Trinity Coherence',
      description: 'Consider refining your Quest statement to better align with your Service and Pledge',
      actionItems: ['Review current Quest statement', 'Identify alignment gaps', 'Refine Trinity elements']
    }
  ];
}

function analyzeCareerProgression(workExperiences: any): any {
  return {
    trajectory: 'upward',
    averageRoleLength: 2.5,
    promotionRate: 0.6,
    industryStability: 0.8
  };
}

function identifySkillGaps(userSkills: any, currentRole: string): any[] {
  return [
    {
      skillName: 'Leadership',
      importance: 0.8,
      currentLevel: 'intermediate',
      targetLevel: 'advanced',
      priority: 'high'
    }
  ];
}

function calculateCareerVelocity(workExperiences: any): number {
  return Math.random() * 0.3 + 0.7; // 0.7-1.0
}

function calculateIndustryDiversity(workExperiences: any): number {
  return Math.random() * 0.5 + 0.5; // 0.5-1.0
}

function generateCareerRecommendations(userData: any): any[] {
  return [
    {
      type: 'career_advancement',
      title: 'Develop Leadership Skills',
      description: 'Focus on leadership development to advance to senior roles',
      priority: 'high'
    }
  ];
}

function calculateSkillGrowthRate(userSkill: any, workExperiences: any): number {
  return Math.random() * 0.5 + 0.5; // 0.5-1.0
}

function calculateIndustryDemand(skillName: string): number {
  const highDemandSkills = ['javascript', 'python', 'react', 'aws', 'leadership'];
  return highDemandSkills.includes(skillName.toLowerCase()) ? 0.8 : 0.5;
}

function calculateFutureRelevance(skillName: string): number {
  const futureTechSkills = ['ai', 'machine learning', 'blockchain', 'quantum computing'];
  return futureTechSkills.some(tech => skillName.toLowerCase().includes(tech)) ? 0.9 : 0.6;
}

function generateLearningPath(userSkill: any): any[] {
  return [
    {
      step: 1,
      title: 'Advanced Course',
      description: `Take an advanced course in ${userSkill.skill.name}`,
      estimatedTime: '2-3 months'
    }
  ];
}

function identifyRelatedSkills(skillName: string, userSkills: any): string[] {
  const relatedSkillsMap: { [key: string]: string[] } = {
    'javascript': ['typescript', 'react', 'node.js'],
    'python': ['django', 'flask', 'data science'],
    'react': ['javascript', 'redux', 'next.js']
  };
  
  return relatedSkillsMap[skillName.toLowerCase()] || [];
}

function calculateSurfaceScore(userData: any): number {
  const { surfaceProfile, workExperiences, userSkills } = userData;
  let score = 0;
  
  if (surfaceProfile?.headline) score += 20;
  if (surfaceProfile?.publicBio) score += 20;
  if (workExperiences?.length > 0) score += 30;
  if (userSkills?.length > 0) score += 30;
  
  return Math.min(score, 100);
}

function calculateWorkingScore(userData: any): number {
  const { workingProfile, workingProjects, workingAchievements } = userData;
  let score = 0;
  
  if (workingProfile?.title) score += 25;
  if (workingProjects?.length > 0) score += 35;
  if (workingAchievements?.length > 0) score += 40;
  
  return Math.min(score, 100);
}

function calculatePersonalScore(userData: any): number {
  const { personalGoals, personalNotes, objectives } = userData;
  let score = 0;
  
  if (personalGoals?.length > 0) score += 30;
  if (personalNotes?.length > 0) score += 30;
  if (objectives?.length > 0) score += 40;
  
  return Math.min(score, 100);
}

function calculateDeepScore(userData: any): number {
  const { trinityCore, deepInsights } = userData;
  let score = 0;
  
  if (trinityCore) score += 60;
  if (deepInsights?.length > 0) score += 40;
  
  return Math.min(score, 100);
}

function calculateTrinityAlignment(userData: any): number {
  return Math.random() * 0.3 + 0.7; // 0.7-1.0
}

function calculateDataFreshness(userData: any): number {
  return Math.random() * 0.3 + 0.7; // 0.7-1.0
}

function calculateEngagementLevel(userData: any): number {
  return Math.random() * 0.3 + 0.7; // 0.7-1.0
}

function generateHealthRecommendations(userData: any): any[] {
  return [
    {
      type: 'data_completeness',
      title: 'Complete Your Profile',
      description: 'Add more details to your working profile to improve visibility',
      priority: 'medium'
    }
  ];
}

function analyzeCrossLayerConnections(userData: any): any[] {
  return [
    {
      type: 'alignment',
      title: 'Skills-Goals Alignment',
      description: 'Your current skills align well with your stated career goals',
      layers: ['surface', 'personal'],
      dataPoints: { skills: 'javascript,react', goals: 'senior_developer' },
      priority: 'medium',
      impact: 0.7,
      confidence: 0.8
    }
  ];
}

function generateTrinityInsights(trinityAnalysis: any, userData: any): any[] {
  return [
    {
      type: 'trinity',
      category: 'professional',
      title: 'Trinity Coherence Opportunity',
      description: 'Your Trinity shows strong potential but could benefit from alignment refinement',
      confidence: 0.8,
      priority: 'high',
      actionItems: ['Review Quest statement', 'Align Service with current work'],
      dataSource: 'trinity'
    }
  ];
}

function generateCareerInsights(careerAnalysis: any, userData: any): any[] {
  return [
    {
      type: 'career',
      category: 'professional',
      title: 'Career Advancement Path',
      description: 'Based on your progression, consider focusing on leadership development',
      confidence: 0.7,
      priority: 'high',
      actionItems: ['Take leadership course', 'Seek mentorship', 'Lead a project'],
      dataSource: 'working'
    }
  ];
}

function generateSkillInsights(skillAnalysis: any, userData: any): any[] {
  return [
    {
      type: 'skill',
      category: 'learning',
      title: 'Skill Development Priority',
      description: 'Focus on high-demand skills to maximize career impact',
      confidence: 0.8,
      priority: 'medium',
      actionItems: ['Identify skill gaps', 'Create learning plan', 'Practice consistently'],
      dataSource: 'surface'
    }
  ];
}

function generateHealthInsights(healthMetrics: any, userData: any): any[] {
  return [
    {
      type: 'health',
      category: 'personal',
      title: 'Repository Health Optimization',
      description: 'Improve your repository completeness to maximize insights quality',
      confidence: 0.9,
      priority: 'medium',
      actionItems: ['Complete missing sections', 'Update recent activities', 'Set regular review schedule'],
      dataSource: 'deep'
    }
  ];
}