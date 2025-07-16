import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch repository health metrics
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === 'true';

    const healthMetrics = await prisma.repoHealthMetrics.findMany({
      where: { userId: user.id },
      orderBy: { calculatedAt: 'desc' },
      take: latest ? 1 : 10
    });

    if (latest && healthMetrics.length > 0) {
      return NextResponse.json(healthMetrics[0]);
    }

    return NextResponse.json(healthMetrics);
  } catch (error) {
    console.error('Error fetching repository health:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Calculate fresh repository health metrics
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();

    console.log(`Calculating repository health for user ${user.id}`);

    // Fetch comprehensive user data
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

    // Calculate health metrics
    const metrics = await calculateRepositoryHealth(userData);

    // Save metrics to database
    const savedMetrics = await prisma.repoHealthMetrics.create({
      data: {
        userId: user.id,
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

    return NextResponse.json({
      ...savedMetrics,
      details: metrics.details
    }, { status: 201 });

  } catch (error) {
    console.error('Error calculating repository health:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate health metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function calculateRepositoryHealth(userData: any) {
  const details = {
    surface: calculateSurfaceHealth(userData),
    working: calculateWorkingHealth(userData),
    personal: calculatePersonalHealth(userData),
    deep: calculateDeepHealth(userData)
  };

  // Calculate individual layer scores
  const surfaceScore = details.surface.score;
  const workingScore = details.working.score;
  const personalScore = details.personal.score;
  const deepScore = details.deep.score;

  // Calculate additional metrics
  const trinityAlignment = calculateTrinityAlignment(userData);
  const dataFreshness = calculateDataFreshness(userData);
  const engagementLevel = calculateEngagementLevel(userData);

  // Calculate overall score with weights
  const overallScore = (
    surfaceScore * 0.2 +
    workingScore * 0.25 +
    personalScore * 0.2 +
    deepScore * 0.25 +
    trinityAlignment * 0.1
  );

  // Generate recommendations
  const recommendations = generateHealthRecommendations(details, {
    overallScore,
    surfaceScore,
    workingScore,
    personalScore,
    deepScore,
    trinityAlignment,
    dataFreshness,
    engagementLevel
  });

  return {
    overallScore: Math.round(overallScore),
    surfaceScore: Math.round(surfaceScore),
    workingScore: Math.round(workingScore),
    personalScore: Math.round(personalScore),
    deepScore: Math.round(deepScore),
    trinityAlignment: Math.round(trinityAlignment * 100) / 100,
    dataFreshness: Math.round(dataFreshness * 100) / 100,
    engagementLevel: Math.round(engagementLevel * 100) / 100,
    recommendations,
    details
  };
}

function calculateSurfaceHealth(userData: any) {
  const { surfaceProfile, workExperiences, userSkills, userEducation } = userData;
  
  let score = 0;
  let maxScore = 0;
  const issues = [];
  const strengths = [];

  // Profile completeness (30 points)
  maxScore += 30;
  if (surfaceProfile?.headline) {
    score += 15;
    strengths.push('Professional headline defined');
  } else {
    issues.push('Missing professional headline');
  }

  if (surfaceProfile?.publicBio) {
    score += 15;
    strengths.push('Public bio completed');
  } else {
    issues.push('Missing public bio');
  }

  // Work experience (40 points)
  maxScore += 40;
  if (workExperiences?.length > 0) {
    score += 25;
    strengths.push(`${workExperiences.length} work experience(s) added`);
    
    if (workExperiences.length >= 3) {
      score += 15;
      strengths.push('Comprehensive work history');
    }
  } else {
    issues.push('No work experience added');
  }

  // Skills (25 points)
  maxScore += 25;
  if (userSkills?.length > 0) {
    score += 15;
    strengths.push(`${userSkills.length} skill(s) listed`);
    
    if (userSkills.length >= 5) {
      score += 10;
      strengths.push('Diverse skill set');
    }
  } else {
    issues.push('No skills listed');
  }

  // Education (5 points)
  maxScore += 5;
  if (userEducation?.length > 0) {
    score += 5;
    strengths.push('Education background included');
  } else {
    issues.push('No education background');
  }

  return {
    score: Math.round((score / maxScore) * 100),
    strengths,
    issues,
    completeness: {
      profile: !!surfaceProfile,
      workExperience: workExperiences?.length > 0,
      skills: userSkills?.length > 0,
      education: userEducation?.length > 0
    }
  };
}

function calculateWorkingHealth(userData: any) {
  const { workingProfile, workingProjects, workingAchievements, workingMedia } = userData;
  
  let score = 0;
  let maxScore = 0;
  const issues = [];
  const strengths = [];

  // Working profile (25 points)
  maxScore += 25;
  if (workingProfile?.title) {
    score += 15;
    strengths.push('Professional title defined');
  } else {
    issues.push('Missing professional title');
  }

  if (workingProfile?.description) {
    score += 10;
    strengths.push('Professional description provided');
  } else {
    issues.push('Missing professional description');
  }

  // Projects (45 points)
  maxScore += 45;
  if (workingProjects?.length > 0) {
    score += 25;
    strengths.push(`${workingProjects.length} project(s) documented`);
    
    if (workingProjects.length >= 3) {
      score += 20;
      strengths.push('Strong project portfolio');
    }
  } else {
    issues.push('No projects documented');
  }

  // Achievements (25 points)
  maxScore += 25;
  if (workingAchievements?.length > 0) {
    score += 15;
    strengths.push(`${workingAchievements.length} achievement(s) documented`);
    
    if (workingAchievements.length >= 3) {
      score += 10;
      strengths.push('Well-documented achievements');
    }
  } else {
    issues.push('No achievements documented');
  }

  // Media (5 points)
  maxScore += 5;
  if (workingMedia?.length > 0) {
    score += 5;
    strengths.push('Media/portfolio items included');
  }

  return {
    score: Math.round((score / maxScore) * 100),
    strengths,
    issues,
    completeness: {
      profile: !!workingProfile,
      projects: workingProjects?.length > 0,
      achievements: workingAchievements?.length > 0,
      media: workingMedia?.length > 0
    }
  };
}

function calculatePersonalHealth(userData: any) {
  const { personalGoals, personalNotes, objectives } = userData;
  
  let score = 0;
  let maxScore = 0;
  const issues = [];
  const strengths = [];

  // Personal goals (40 points)
  maxScore += 40;
  if (personalGoals?.length > 0) {
    score += 25;
    strengths.push(`${personalGoals.length} personal goal(s) tracked`);
    
    if (personalGoals.length >= 3) {
      score += 15;
      strengths.push('Comprehensive goal tracking');
    }
  } else {
    issues.push('No personal goals set');
  }

  // OKRs (40 points)
  maxScore += 40;
  if (objectives?.length > 0) {
    score += 25;
    strengths.push(`${objectives.length} objective(s) defined`);
    
    const totalKeyResults = objectives.reduce((sum: number, obj: any) => sum + obj.keyResults.length, 0);
    if (totalKeyResults > 0) {
      score += 15;
      strengths.push(`${totalKeyResults} key result(s) tracked`);
    }
  } else {
    issues.push('No OKRs defined');
  }

  // Personal notes (20 points)
  maxScore += 20;
  if (personalNotes?.length > 0) {
    score += 20;
    strengths.push(`${personalNotes.length} personal note(s) recorded`);
  } else {
    issues.push('No personal development notes');
  }

  return {
    score: Math.round((score / maxScore) * 100),
    strengths,
    issues,
    completeness: {
      goals: personalGoals?.length > 0,
      objectives: objectives?.length > 0,
      notes: personalNotes?.length > 0
    }
  };
}

function calculateDeepHealth(userData: any) {
  const { trinityCore, deepInsights } = userData;
  
  let score = 0;
  let maxScore = 0;
  const issues = [];
  const strengths = [];

  // Trinity Core (70 points)
  maxScore += 70;
  if (trinityCore) {
    score += 30;
    strengths.push('Trinity Core established');
    
    if (trinityCore.questAnalysis) {
      score += 15;
      strengths.push('Quest analysis completed');
    }
    
    if (trinityCore.serviceAnalysis) {
      score += 15;
      strengths.push('Service analysis completed');
    }
    
    if (trinityCore.pledgeAnalysis) {
      score += 10;
      strengths.push('Pledge analysis completed');
    }
  } else {
    issues.push('Trinity Core not established');
  }

  // Deep Insights (30 points)
  maxScore += 30;
  if (deepInsights?.length > 0) {
    score += 20;
    strengths.push(`${deepInsights.length} deep insight(s) generated`);
    
    if (deepInsights.length >= 5) {
      score += 10;
      strengths.push('Rich insights collection');
    }
  } else {
    issues.push('No deep insights generated');
  }

  return {
    score: Math.round((score / maxScore) * 100),
    strengths,
    issues,
    completeness: {
      trinityCore: !!trinityCore,
      insights: deepInsights?.length > 0
    }
  };
}

function calculateTrinityAlignment(userData: any): number {
  const { trinityCore, workExperiences, userSkills, personalGoals } = userData;
  
  if (!trinityCore) return 0;
  
  // Simplified alignment calculation
  let alignmentScore = 0;
  
  // Base coherence score
  alignmentScore += (trinityCore.coherenceScore || 0) * 0.4;
  
  // Work alignment
  if (workExperiences?.length > 0) {
    alignmentScore += 0.3;
  }
  
  // Skills alignment
  if (userSkills?.length > 0) {
    alignmentScore += 0.2;
  }
  
  // Goals alignment
  if (personalGoals?.length > 0) {
    alignmentScore += 0.1;
  }
  
  return Math.min(alignmentScore, 1);
}

function calculateDataFreshness(userData: any): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let recentActivity = 0;
  let totalActivity = 0;
  
  // Check recent updates across all layers
  const checkFreshness = (items: any[], dateField: string) => {
    if (!items) return;
    
    items.forEach(item => {
      totalActivity++;
      const date = new Date(item[dateField]);
      if (date > thirtyDaysAgo) {
        recentActivity++;
      }
    });
  };
  
  checkFreshness(userData.workExperiences, 'updatedAt');
  checkFreshness(userData.userSkills, 'createdAt');
  checkFreshness(userData.personalGoals, 'updatedAt');
  checkFreshness(userData.objectives, 'updatedAt');
  checkFreshness(userData.deepInsights, 'generatedAt');
  
  return totalActivity > 0 ? recentActivity / totalActivity : 0;
}

function calculateEngagementLevel(userData: any): number {
  // Simple engagement calculation based on data variety and completeness
  let engagementScore = 0;
  
  if (userData.surfaceProfile) engagementScore += 0.1;
  if (userData.workExperiences?.length > 0) engagementScore += 0.2;
  if (userData.userSkills?.length > 0) engagementScore += 0.1;
  if (userData.workingProfile) engagementScore += 0.1;
  if (userData.workingProjects?.length > 0) engagementScore += 0.15;
  if (userData.personalGoals?.length > 0) engagementScore += 0.1;
  if (userData.objectives?.length > 0) engagementScore += 0.15;
  if (userData.trinityCore) engagementScore += 0.1;
  
  return Math.min(engagementScore, 1);
}

function generateHealthRecommendations(details: any, scores: any): any[] {
  const recommendations = [];
  
  // Surface layer recommendations
  if (scores.surfaceScore < 70) {
    recommendations.push({
      type: 'surface_improvement',
      priority: 'high',
      title: 'Complete Your Public Profile',
      description: 'Your public profile needs attention to improve professional visibility.',
      actions: details.surface.issues.slice(0, 3)
    });
  }
  
  // Working layer recommendations
  if (scores.workingScore < 60) {
    recommendations.push({
      type: 'working_enhancement',
      priority: 'high',
      title: 'Strengthen Your Portfolio',
      description: 'Add more projects and achievements to showcase your work.',
      actions: details.working.issues.slice(0, 3)
    });
  }
  
  // Personal layer recommendations
  if (scores.personalScore < 50) {
    recommendations.push({
      type: 'personal_development',
      priority: 'medium',
      title: 'Set Personal Development Goals',
      description: 'Define clear objectives and track your personal growth.',
      actions: details.personal.issues.slice(0, 3)
    });
  }
  
  // Deep layer recommendations
  if (scores.deepScore < 40) {
    recommendations.push({
      type: 'deep_foundation',
      priority: 'medium',
      title: 'Establish Your Trinity Core',
      description: 'Define your professional identity through Trinity analysis.',
      actions: details.deep.issues.slice(0, 3)
    });
  }
  
  // Data freshness recommendations
  if (scores.dataFreshness < 0.3) {
    recommendations.push({
      type: 'data_maintenance',
      priority: 'low',
      title: 'Update Your Repository',
      description: 'Keep your professional repository current with recent activities.',
      actions: ['Update recent work experiences', 'Add new skills', 'Review personal goals']
    });
  }
  
  return recommendations;
}