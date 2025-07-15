import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { Neo4jSchemaManager } from '@/lib/neo4j-schema';
import { isNeo4jConfigured } from '@/lib/neo4j';

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

// Helper functions for Neo4j data processing
function getNodeColor(type: string): string {
  switch (type) {
    case 'user': return '#3b82f6'; // blue
    case 'company': return '#10b981'; // green
    case 'skill': return '#8b5cf6'; // purple
    case 'institution': return '#f59e0b'; // amber
    default: return '#6b7280'; // gray
  }
}

function getNodeSize(type: string, properties: any): number {
  switch (type) {
    case 'user': return 20;
    case 'company': return 15;
    case 'skill': return 10 + (properties.yearsOfExperience || 0);
    case 'institution': return 12;
    default: return 10;
  }
}

function getRelationshipStrength(type: string, properties: any): number {
  switch (type) {
    case 'WORKED_AT':
      if (properties.startDate && properties.endDate) {
        const start = new Date(properties.startDate);
        const end = new Date(properties.endDate);
        const duration = Math.abs(end.getTime() - start.getTime());
        const months = duration / (1000 * 60 * 60 * 24 * 30);
        return Math.min(months / 12, 5); // Max strength of 5
      }
      return 1;
    case 'HAS_SKILL':
      return Math.min((properties.yearsOfExperience || 1) / 5, 3); // Max strength of 3
    case 'STUDIED_AT':
      return 2; // Standard strength for education
    default:
      return 1;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();

    // Try to get data from Neo4j first (only if configured)
    if (isNeo4jConfigured()) {
      try {
        const neo4jData = await Neo4jSchemaManager.getProfessionalNetworkData(user.user.id);
        
        if (neo4jData.nodes.length > 0) {
        // Convert Neo4j data to the expected format
        const nodes: GraphNode[] = neo4jData.nodes.map(node => ({
          id: node.id,
          name: node.properties.name || 'Unknown',
          type: node.properties.type as 'user' | 'company' | 'skill' | 'institution',
          color: getNodeColor(node.properties.type),
          size: getNodeSize(node.properties.type, node.properties),
          metadata: node.properties
        }));

        const links: GraphLink[] = neo4jData.relationships.map(rel => ({
          source: rel.startNode,
          target: rel.endNode,
          type: rel.type.toLowerCase().replace('_', '_') as 'works_at' | 'has_skill' | 'studied_at',
          strength: getRelationshipStrength(rel.type, rel.properties),
          metadata: rel.properties
        }));

        const graphData = {
          nodes,
          links,
          stats: {
            totalNodes: nodes.length,
            totalLinks: links.length,
            companies: neo4jData.stats.companyCount,
            skills: neo4jData.stats.skillCount,
            institutions: neo4jData.stats.institutionCount
          },
          source: 'neo4j'
        };

          return NextResponse.json(graphData);
        }
      } catch (neo4jError) {
        console.log('Neo4j data not available, falling back to PostgreSQL:', neo4jError);
      }
    } else {
      console.log('Neo4j not configured, using PostgreSQL data');
    }

    // Fallback to PostgreSQL data
    const [workExperiences, userSkills, userEducation] = await Promise.all([
      prisma.workExperience.findMany({
        where: { userId: user.user.id },
        include: { company: true }
      }),
      prisma.userSkill.findMany({
        where: { userId: user.user.id },
        include: { skill: true }
      }),
      prisma.userEducation.findMany({
        where: { userId: user.user.id },
        include: { institution: true }
      })
    ]);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add user node (center of the graph)
    nodes.push({
      id: user.user.id,
      name: user.user.name || 'You',
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
        source: user.user.id,
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
        source: user.user.id,
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
        source: user.user.id,
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
      },
      source: 'postgresql'
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