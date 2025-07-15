import { ProfessionalGraphQueries, neo4jConnection } from './neo4j';

/**
 * Neo4j Graph Schema for Professional Relationships
 * 
 * Node Types:
 * - User: Individual professionals
 * - Company: Organizations where users work
 * - Skill: Technical/professional capabilities
 * - Institution: Educational institutions
 * 
 * Relationship Types:
 * - WORKED_AT: User -> Company (with role, dates, etc.)
 * - HAS_SKILL: User -> Skill (with proficiency, experience)
 * - STUDIED_AT: User -> Institution (with degree, dates)
 * - COLLEAGUES: User -> User (derived from shared companies)
 * - SKILL_MIGRATION: Skill -> Company (derived from users moving skills)
 */

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, any>;
}

export interface ProfessionalNetworkData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  stats: {
    nodeCount: number;
    relationshipCount: number;
    userCount: number;
    companyCount: number;
    skillCount: number;
    institutionCount: number;
  };
}

export class Neo4jSchemaManager {
  
  // Initialize all constraints and indexes
  static async initializeSchema() {
    console.log('Initializing Neo4j schema...');
    
    // Create uniqueness constraints
    const constraints = [
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE',
      'CREATE CONSTRAINT institution_id_unique IF NOT EXISTS FOR (i:Institution) REQUIRE i.id IS UNIQUE'
    ];

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX user_clerk_id_index IF NOT EXISTS FOR (u:User) ON (u.clerkId)',
      'CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)',
      'CREATE INDEX company_name_index IF NOT EXISTS FOR (c:Company) ON (c.name)',
      'CREATE INDEX skill_name_index IF NOT EXISTS FOR (s:Skill) ON (s.name)',
      'CREATE INDEX institution_name_index IF NOT EXISTS FOR (i:Institution) ON (i.name)',
      'CREATE INDEX work_relationship_dates IF NOT EXISTS FOR ()-[r:WORKED_AT]->() ON (r.startDate, r.endDate)',
      'CREATE INDEX skill_relationship_proficiency IF NOT EXISTS FOR ()-[r:HAS_SKILL]->() ON (r.proficiencyLevel)'
    ];

    await ProfessionalGraphQueries.initializeConstraints();
    
    // Create indexes
    for (const index of indexes) {
      try {
        await neo4jConnection.executeWriteQuery(index);
        console.log(`Created index: ${index}`);
      } catch (error) {
        console.log(`Index may already exist: ${index}`);
      }
    }
    
    console.log('Schema initialization complete');
  }

  // Sync user data from PostgreSQL to Neo4j
  static async syncUserData(userData: {
    id: string;
    clerkId: string;
    email: string;
    name?: string;
    workExperiences?: Array<{
      id: string;
      companyId: string;
      company: { name: string; industry?: string; website?: string };
      title: string;
      startDate?: Date;
      endDate?: Date;
      isCurrent: boolean;
      description?: string;
    }>;
    userSkills?: Array<{
      id: string;
      skillId: string;
      skill: { name: string; category?: string; difficultyLevel?: string };
      proficiencyLevel: string;
      yearsOfExperience: number;
      isShowcase: boolean;
    }>;
    userEducation?: Array<{
      id: string;
      institutionId: string;
      institution: { name: string; type?: string; country?: string };
      degree: string;
      fieldOfStudy: string;
      startDate?: Date;
      endDate?: Date;
      gpa?: string;
    }>;
  }) {
    console.log(`Syncing user data to Neo4j: ${userData.id}`);
    
    try {
      // Create user node
      await ProfessionalGraphQueries.createUserNode(userData.id, {
        clerkId: userData.clerkId,
        email: userData.email,
        name: userData.name
      });

      // Sync work experiences
      if (userData.workExperiences) {
        for (const work of userData.workExperiences) {
          // Create company node
          await ProfessionalGraphQueries.createCompanyNode(work.companyId, {
            name: work.company.name,
            industry: work.company.industry,
            website: work.company.website
          });

          // Create work relationship
          await ProfessionalGraphQueries.createWorkRelationship(userData.id, work.companyId, {
            title: work.title,
            startDate: work.startDate,
            endDate: work.endDate,
            isCurrent: work.isCurrent,
            description: work.description
          });
        }
      }

      // Sync skills
      if (userData.userSkills) {
        for (const userSkill of userData.userSkills) {
          // Create skill node
          await ProfessionalGraphQueries.createSkillNode(userSkill.skillId, {
            name: userSkill.skill.name,
            category: userSkill.skill.category,
            difficultyLevel: userSkill.skill.difficultyLevel
          });

          // Create skill relationship
          await ProfessionalGraphQueries.createSkillRelationship(userData.id, userSkill.skillId, {
            proficiencyLevel: userSkill.proficiencyLevel,
            yearsOfExperience: userSkill.yearsOfExperience,
            isShowcase: userSkill.isShowcase
          });
        }
      }

      // Sync education
      if (userData.userEducation) {
        for (const education of userData.userEducation) {
          // Create institution node
          await ProfessionalGraphQueries.createInstitutionNode(education.institutionId, {
            name: education.institution.name,
            type: education.institution.type,
            country: education.institution.country
          });

          // Create education relationship
          await ProfessionalGraphQueries.createEducationRelationship(userData.id, education.institutionId, {
            degree: education.degree,
            fieldOfStudy: education.fieldOfStudy,
            startDate: education.startDate,
            endDate: education.endDate,
            gpa: education.gpa
          });
        }
      }

      console.log(`Successfully synced user data: ${userData.id}`);
      return true;
    } catch (error) {
      console.error(`Error syncing user data: ${userData.id}`, error);
      throw error;
    }
  }

  // Get professional network data for visualization
  static async getProfessionalNetworkData(userId: string): Promise<ProfessionalNetworkData> {
    const query = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[work:WORKED_AT]->(company:Company)
      OPTIONAL MATCH (u)-[skill:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (u)-[edu:STUDIED_AT]->(institution:Institution)
      
      WITH u, 
           collect(DISTINCT {node: company, relationship: work, type: 'Company'}) as companies,
           collect(DISTINCT {node: s, relationship: skill, type: 'Skill'}) as skills,
           collect(DISTINCT {node: institution, relationship: edu, type: 'Institution'}) as institutions
      
      RETURN u,
             companies,
             skills, 
             institutions
    `;

    try {
      const result = await neo4jConnection.executeReadQuery(query, { userId });
      
      if (result.length === 0) {
        return {
          nodes: [],
          relationships: [],
          stats: {
            nodeCount: 0,
            relationshipCount: 0,
            userCount: 0,
            companyCount: 0,
            skillCount: 0,
            institutionCount: 0
          }
        };
      }

      const record = result[0];
      const user = record.get('u');
      const companies = record.get('companies');
      const skills = record.get('skills');
      const institutions = record.get('institutions');

      const nodes: GraphNode[] = [];
      const relationships: GraphRelationship[] = [];

      // Add user node
      nodes.push({
        id: user.properties.id,
        labels: ['User'],
        properties: {
          ...user.properties,
          name: user.properties.name || 'You',
          type: 'user'
        }
      });

      // Add company nodes and relationships
      companies.forEach((item: any) => {
        if (item.node && item.node.properties) {
          nodes.push({
            id: item.node.properties.id,
            labels: ['Company'],
            properties: {
              ...item.node.properties,
              type: 'company'
            }
          });

          if (item.relationship && item.relationship.properties) {
            relationships.push({
              id: `${userId}-worked-${item.node.properties.id}`,
              type: 'WORKED_AT',
              startNode: userId,
              endNode: item.node.properties.id,
              properties: item.relationship.properties
            });
          }
        }
      });

      // Add skill nodes and relationships
      skills.forEach((item: any) => {
        if (item.node && item.node.properties) {
          nodes.push({
            id: item.node.properties.id,
            labels: ['Skill'],
            properties: {
              ...item.node.properties,
              type: 'skill'
            }
          });

          if (item.relationship && item.relationship.properties) {
            relationships.push({
              id: `${userId}-has-skill-${item.node.properties.id}`,
              type: 'HAS_SKILL',
              startNode: userId,
              endNode: item.node.properties.id,
              properties: item.relationship.properties
            });
          }
        }
      });

      // Add institution nodes and relationships
      institutions.forEach((item: any) => {
        if (item.node && item.node.properties) {
          nodes.push({
            id: item.node.properties.id,
            labels: ['Institution'],
            properties: {
              ...item.node.properties,
              type: 'institution'
            }
          });

          if (item.relationship && item.relationship.properties) {
            relationships.push({
              id: `${userId}-studied-${item.node.properties.id}`,
              type: 'STUDIED_AT',
              startNode: userId,
              endNode: item.node.properties.id,
              properties: item.relationship.properties
            });
          }
        }
      });

      // Get database stats
      const stats = await ProfessionalGraphQueries.getDatabaseStats();

      return {
        nodes,
        relationships,
        stats: {
          nodeCount: nodes.length,
          relationshipCount: relationships.length,
          userCount: stats.userCount || 0,
          companyCount: stats.companyCount || 0,
          skillCount: stats.skillCount || 0,
          institutionCount: stats.institutionCount || 0
        }
      };
    } catch (error) {
      console.error('Error getting professional network data:', error);
      throw error;
    }
  }

  // Get career insights
  static async getCareerInsights(userId: string) {
    const insights = {
      careerProgression: [] as any[],
      skillEvolution: [] as any[],
      industryExperience: [] as any[],
      networkConnections: [] as any[]
    };

    try {
      // Career progression analysis
      const careerQuery = `
        MATCH (u:User {id: $userId})-[work:WORKED_AT]->(company:Company)
        RETURN work.title as role, 
               work.startDate as startDate,
               work.endDate as endDate,
               work.isCurrent as isCurrent,
               company.name as company,
               company.industry as industry
        ORDER BY work.startDate ASC
      `;

      const careerResult = await neo4jConnection.executeReadQuery(careerQuery, { userId });
      insights.careerProgression = careerResult.map(record => ({
        role: record.get('role'),
        startDate: record.get('startDate'),
        endDate: record.get('endDate'),
        isCurrent: record.get('isCurrent'),
        company: record.get('company'),
        industry: record.get('industry')
      }));

      // Skill evolution analysis
      const skillQuery = `
        MATCH (u:User {id: $userId})-[skill:HAS_SKILL]->(s:Skill)
        RETURN s.name as skillName,
               s.category as category,
               skill.proficiencyLevel as proficiency,
               skill.yearsOfExperience as experience,
               skill.isShowcase as isShowcase
        ORDER BY skill.yearsOfExperience DESC
      `;

      const skillResult = await neo4jConnection.executeReadQuery(skillQuery, { userId });
      insights.skillEvolution = skillResult.map(record => ({
        skillName: record.get('skillName'),
        category: record.get('category'),
        proficiency: record.get('proficiency'),
        experience: record.get('experience'),
        isShowcase: record.get('isShowcase')
      }));

      // Industry experience
      const industryQuery = `
        MATCH (u:User {id: $userId})-[work:WORKED_AT]->(company:Company)
        WHERE company.industry IS NOT NULL
        RETURN company.industry as industry,
               count(work) as roleCount,
               collect(DISTINCT work.title) as roles
        ORDER BY roleCount DESC
      `;

      const industryResult = await neo4jConnection.executeReadQuery(industryQuery, { userId });
      insights.industryExperience = industryResult.map(record => ({
        industry: record.get('industry'),
        roleCount: record.get('roleCount').toNumber(),
        roles: record.get('roles')
      }));

      // Network connections
      const networkQuery = `
        MATCH (u:User {id: $userId})-[:WORKED_AT]->(company:Company)<-[:WORKED_AT]-(colleague:User)
        WHERE u <> colleague
        RETURN colleague.name as colleagueName,
               colleague.id as colleagueId,
               company.name as sharedCompany,
               company.industry as industry
        LIMIT 10
      `;

      const networkResult = await neo4jConnection.executeReadQuery(networkQuery, { userId });
      insights.networkConnections = networkResult.map(record => ({
        colleagueName: record.get('colleagueName'),
        colleagueId: record.get('colleagueId'),
        sharedCompany: record.get('sharedCompany'),
        industry: record.get('industry')
      }));

      return insights;
    } catch (error) {
      console.error('Error getting career insights:', error);
      throw error;
    }
  }

  // Clean up user data (for development/testing)
  static async cleanupUserData(userId: string) {
    const query = `
      MATCH (u:User {id: $userId})
      DETACH DELETE u
    `;
    
    await neo4jConnection.executeWriteQuery(query, { userId });
    console.log(`User data cleaned up for: ${userId}`);
  }

  // Clean up all data (for development)
  static async cleanupAllData() {
    const query = 'MATCH (n) DETACH DELETE n';
    await neo4jConnection.executeWriteQuery(query);
    console.log('All Neo4j data cleaned up');
  }
}

export default Neo4jSchemaManager;