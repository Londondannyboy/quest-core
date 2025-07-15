import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth-helpers';

interface GraphNode {
  id: string;
  name: string;
  type: 'user' | 'company' | 'skill' | 'institution';
  color: string;
  size: number;
  metadata?: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'works_at' | 'has_skill' | 'studied_at';
  strength: number;
  metadata?: any;
}

export async function GET() {
  try {
    const { user } = await getOrCreateUser();

    // Fetch user's professional data
    const [workExperiences, userSkills, userEducation] = await Promise.all([
      prisma.workExperience.findMany({
        where: { userId: user.id },
        include: { company: true }
      }),
      prisma.userSkill.findMany({
        where: { userId: user.id },
        include: { skill: true }
      }),
      prisma.userEducation.findMany({
        where: { userId: user.id },
        include: { institution: true }
      })
    ]);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add user node (center of the graph)
    nodes.push({
      id: user.id,
      name: user.name || 'You',
      type: 'user',
      color: '#3b82f6', // blue
      size: 20
    });

    // Add company nodes and links
    const companies = new Map();
    workExperiences.forEach(exp => {
      if (!companies.has(exp.company.id)) {
        companies.set(exp.company.id, exp.company);
        nodes.push({
          id: exp.company.id,
          name: exp.company.name,
          type: 'company',
          color: '#10b981', // green
          size: 15,
          metadata: {
            industry: exp.company.industry,
            website: exp.company.website
          }
        });
      }

      // Calculate link strength based on duration
      let strength = 1;
      if (exp.startDate && exp.endDate) {
        const duration = Math.abs(exp.endDate.getTime() - exp.startDate.getTime());
        const months = duration / (1000 * 60 * 60 * 24 * 30);
        strength = Math.min(months / 12, 5); // Max strength of 5
      }

      links.push({
        source: user.id,
        target: exp.company.id,
        type: 'works_at',
        strength,
        metadata: {
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.isCurrent
        }
      });
    });

    // Add skill nodes and links
    const skills = new Map();
    userSkills.forEach(userSkill => {
      if (!skills.has(userSkill.skill.id)) {
        skills.set(userSkill.skill.id, userSkill.skill);
        nodes.push({
          id: userSkill.skill.id,
          name: userSkill.skill.name,
          type: 'skill',
          color: '#8b5cf6', // purple
          size: 10 + (userSkill.yearsOfExperience || 0), // Size based on experience
          metadata: {
            category: userSkill.skill.category,
            difficultyLevel: userSkill.skill.difficultyLevel
          }
        });
      }

      // Link strength based on proficiency and experience
      let strength = 1;
      if (userSkill.yearsOfExperience) {
        strength = Math.min(userSkill.yearsOfExperience / 5, 3); // Max strength of 3
      }

      links.push({
        source: user.id,
        target: userSkill.skill.id,
        type: 'has_skill',
        strength,
        metadata: {
          proficiencyLevel: userSkill.proficiencyLevel,
          yearsOfExperience: userSkill.yearsOfExperience,
          isShowcase: userSkill.isShowcase
        }
      });
    });

    // Add education nodes and links
    const institutions = new Map();
    userEducation.forEach(edu => {
      if (!institutions.has(edu.institution.id)) {
        institutions.set(edu.institution.id, edu.institution);
        nodes.push({
          id: edu.institution.id,
          name: edu.institution.name,
          type: 'institution',
          color: '#f59e0b', // amber
          size: 12,
          metadata: {
            type: edu.institution.type,
            country: edu.institution.country,
            website: edu.institution.website
          }
        });
      }

      links.push({
        source: user.id,
        target: edu.institution.id,
        type: 'studied_at',
        strength: 2, // Standard strength for education
        metadata: {
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startDate: edu.startDate,
          endDate: edu.endDate
        }
      });
    });

    // Add cross-connections (companies to skills, institutions to skills, etc.)
    // This creates a richer graph structure

    // Connect skills to companies where they were used
    workExperiences.forEach(exp => {
      // For now, connect all user skills to all companies (simplified)
      // In a real scenario, you'd have more specific skill-company relationships
      userSkills.slice(0, 3).forEach(userSkill => { // Limit to top 3 skills to avoid clutter
        links.push({
          source: exp.company.id,
          target: userSkill.skill.id,
          type: 'works_at', // Company utilizes skill
          strength: 0.5, // Weaker connection
          metadata: {
            context: 'skill_utilized_at_company'
          }
        });
      });
    });

    const graphData = {
      nodes,
      links,
      stats: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        companies: companies.size,
        skills: skills.size,
        institutions: institutions.size
      }
    };

    return NextResponse.json(graphData);

  } catch (error) {
    console.error('Error creating professional graph:', error);
    return NextResponse.json(
      { error: 'Failed to create professional graph' },
      { status: 500 }
    );
  }
}