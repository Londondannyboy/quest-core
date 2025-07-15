import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jConnection {
  private driver: Driver | null = null;
  private static instance: Neo4jConnection;

  constructor() {
    if (Neo4jConnection.instance) {
      return Neo4jConnection.instance;
    }
    Neo4jConnection.instance = this;
  }

  async connect() {
    if (this.driver) {
      return this.driver;
    }

    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      console.warn('Neo4j environment variables are not configured, Neo4j features will be disabled');
      throw new Error('Neo4j environment variables are not configured');
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      
      // Verify connection
      await this.driver.verifyConnectivity();
      console.log('Neo4j connection established successfully');
      
      return this.driver;
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async getSession(): Promise<Session> {
    const driver = await this.connect();
    return driver.session();
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  async executeQuery(query: string, parameters: Record<string, any> = {}) {
    const session = await this.getSession();
    
    try {
      const result = await session.run(query, parameters);
      return result.records;
    } catch (error) {
      console.error('Neo4j query failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async executeReadQuery(query: string, parameters: Record<string, any> = {}) {
    const session = await this.getSession();
    
    try {
      const result = await session.readTransaction(tx => tx.run(query, parameters));
      return result.records;
    } catch (error) {
      console.error('Neo4j read query failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async executeWriteQuery(query: string, parameters: Record<string, any> = {}) {
    const session = await this.getSession();
    
    try {
      const result = await session.writeTransaction(tx => tx.run(query, parameters));
      return result.records;
    } catch (error) {
      console.error('Neo4j write query failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

// Create singleton instance
export const neo4jConnection = new Neo4jConnection();

// Professional graph query helpers
export class ProfessionalGraphQueries {
  
  // Initialize database constraints
  static async initializeConstraints() {
    const constraints = [
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE',
      'CREATE CONSTRAINT institution_id_unique IF NOT EXISTS FOR (i:Institution) REQUIRE i.id IS UNIQUE'
    ];

    for (const constraint of constraints) {
      try {
        await neo4jConnection.executeWriteQuery(constraint);
        console.log(`Created constraint: ${constraint}`);
      } catch (error) {
        console.log(`Constraint may already exist: ${constraint}`);
      }
    }
  }

  // Test connection
  static async testConnection() {
    try {
      const result = await neo4jConnection.executeQuery('RETURN "Hello Neo4j!" as message');
      console.log('Neo4j connection test successful:', result[0]?.get('message'));
      return true;
    } catch (error) {
      console.error('Neo4j connection test failed:', error);
      return false;
    }
  }

  // Create user node
  static async createUserNode(userId: string, userData: {
    name?: string;
    email?: string;
    clerkId: string;
  }) {
    const query = `
      MERGE (u:User {id: $userId})
      SET u.name = $name,
          u.email = $email,
          u.clerkId = $clerkId,
          u.updatedAt = datetime()
      RETURN u
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      userId,
      name: userData.name || '',
      email: userData.email || '',
      clerkId: userData.clerkId
    });
  }

  // Create company node
  static async createCompanyNode(companyId: string, companyData: {
    name: string;
    website?: string;
    industry?: string;
  }) {
    const query = `
      MERGE (c:Company {id: $companyId})
      SET c.name = $name,
          c.website = $website,
          c.industry = $industry,
          c.updatedAt = datetime()
      RETURN c
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      companyId,
      name: companyData.name,
      website: companyData.website || '',
      industry: companyData.industry || ''
    });
  }

  // Create skill node
  static async createSkillNode(skillId: string, skillData: {
    name: string;
    category?: string;
    difficultyLevel?: string;
  }) {
    const query = `
      MERGE (s:Skill {id: $skillId})
      SET s.name = $name,
          s.category = $category,
          s.difficultyLevel = $difficultyLevel,
          s.updatedAt = datetime()
      RETURN s
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      skillId,
      name: skillData.name,
      category: skillData.category || '',
      difficultyLevel: skillData.difficultyLevel || ''
    });
  }

  // Create education institution node
  static async createInstitutionNode(institutionId: string, institutionData: {
    name: string;
    type?: string;
    country?: string;
  }) {
    const query = `
      MERGE (i:Institution {id: $institutionId})
      SET i.name = $name,
          i.type = $type,
          i.country = $country,
          i.updatedAt = datetime()
      RETURN i
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      institutionId,
      name: institutionData.name,
      type: institutionData.type || '',
      country: institutionData.country || ''
    });
  }

  // Create work relationship
  static async createWorkRelationship(userId: string, companyId: string, workData: {
    title: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
  }) {
    const query = `
      MATCH (u:User {id: $userId}), (c:Company {id: $companyId})
      MERGE (u)-[r:WORKED_AT]->(c)
      SET r.title = $title,
          r.startDate = $startDate,
          r.endDate = $endDate,
          r.isCurrent = $isCurrent,
          r.description = $description,
          r.updatedAt = datetime()
      RETURN r
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      userId,
      companyId,
      title: workData.title,
      startDate: workData.startDate?.toISOString() || null,
      endDate: workData.endDate?.toISOString() || null,
      isCurrent: workData.isCurrent,
      description: workData.description || ''
    });
  }

  // Create skill relationship
  static async createSkillRelationship(userId: string, skillId: string, skillData: {
    proficiencyLevel: string;
    yearsOfExperience: number;
    isShowcase: boolean;
  }) {
    const query = `
      MATCH (u:User {id: $userId}), (s:Skill {id: $skillId})
      MERGE (u)-[r:HAS_SKILL]->(s)
      SET r.proficiencyLevel = $proficiencyLevel,
          r.yearsOfExperience = $yearsOfExperience,
          r.isShowcase = $isShowcase,
          r.updatedAt = datetime()
      RETURN r
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      userId,
      skillId,
      proficiencyLevel: skillData.proficiencyLevel,
      yearsOfExperience: skillData.yearsOfExperience,
      isShowcase: skillData.isShowcase
    });
  }

  // Create education relationship
  static async createEducationRelationship(userId: string, institutionId: string, educationData: {
    degree: string;
    fieldOfStudy: string;
    startDate?: Date;
    endDate?: Date;
    gpa?: string;
  }) {
    const query = `
      MATCH (u:User {id: $userId}), (i:Institution {id: $institutionId})
      MERGE (u)-[r:STUDIED_AT]->(i)
      SET r.degree = $degree,
          r.fieldOfStudy = $fieldOfStudy,
          r.startDate = $startDate,
          r.endDate = $endDate,
          r.gpa = $gpa,
          r.updatedAt = datetime()
      RETURN r
    `;
    
    return await neo4jConnection.executeWriteQuery(query, {
      userId,
      institutionId,
      degree: educationData.degree,
      fieldOfStudy: educationData.fieldOfStudy,
      startDate: educationData.startDate?.toISOString() || null,
      endDate: educationData.endDate?.toISOString() || null,
      gpa: educationData.gpa || ''
    });
  }

  // Get user's professional network
  static async getUserProfessionalNetwork(userId: string) {
    const query = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[work:WORKED_AT]->(company:Company)
      OPTIONAL MATCH (u)-[skill:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (u)-[edu:STUDIED_AT]->(institution:Institution)
      RETURN u, 
             collect(DISTINCT {relationship: work, node: company, type: 'WORKED_AT'}) as workConnections,
             collect(DISTINCT {relationship: skill, node: s, type: 'HAS_SKILL'}) as skillConnections,
             collect(DISTINCT {relationship: edu, node: institution, type: 'STUDIED_AT'}) as educationConnections
    `;
    
    return await neo4jConnection.executeReadQuery(query, { userId });
  }

  // Find career paths between roles
  static async findCareerPaths(fromRole: string, toRole: string, maxHops: number = 3) {
    const query = `
      MATCH (u1:User)-[r1:WORKED_AT]->(c1:Company),
            (u2:User)-[r2:WORKED_AT]->(c2:Company)
      WHERE r1.title CONTAINS $fromRole AND r2.title CONTAINS $toRole
      AND u1 <> u2
      RETURN u1.name as fromUser, r1.title as fromRole, c1.name as fromCompany,
             u2.name as toUser, r2.title as toRole, c2.name as toCompany,
             r1.startDate as fromStart, r1.endDate as fromEnd,
             r2.startDate as toStart, r2.endDate as toEnd
      LIMIT 10
    `;
    
    return await neo4jConnection.executeReadQuery(query, { fromRole, toRole });
  }

  // Find skill migration patterns
  static async findSkillMigrationPatterns(skillName: string) {
    const query = `
      MATCH (u:User)-[skill:HAS_SKILL]->(s:Skill)
      WHERE s.name CONTAINS $skillName
      MATCH (u)-[work:WORKED_AT]->(c:Company)
      RETURN c.name as company, 
             c.industry as industry,
             skill.proficiencyLevel as proficiency,
             skill.yearsOfExperience as experience,
             work.title as role,
             work.startDate as startDate,
             work.endDate as endDate,
             s.name as skillName
      ORDER BY work.startDate DESC
    `;
    
    return await neo4jConnection.executeReadQuery(query, { skillName });
  }

  // Get professional network colleagues
  static async getProfessionalColleagues(userId: string) {
    const query = `
      MATCH (u:User {id: $userId})-[:WORKED_AT]->(c:Company)<-[:WORKED_AT]-(colleague:User)
      WHERE u <> colleague
      RETURN colleague.name as colleagueName,
             colleague.id as colleagueId,
             c.name as sharedCompany,
             c.industry as industry
      ORDER BY c.name
    `;
    
    return await neo4jConnection.executeReadQuery(query, { userId });
  }

  // Get database statistics
  static async getDatabaseStats() {
    const queries = [
      'MATCH (u:User) RETURN count(u) as userCount',
      'MATCH (c:Company) RETURN count(c) as companyCount',
      'MATCH (s:Skill) RETURN count(s) as skillCount',
      'MATCH (i:Institution) RETURN count(i) as institutionCount',
      'MATCH ()-[r:WORKED_AT]->() RETURN count(r) as workRelationships',
      'MATCH ()-[r:HAS_SKILL]->() RETURN count(r) as skillRelationships',
      'MATCH ()-[r:STUDIED_AT]->() RETURN count(r) as educationRelationships'
    ];

    const stats: Record<string, number> = {};
    
    for (const query of queries) {
      try {
        const result = await neo4jConnection.executeReadQuery(query);
        if (result.length > 0) {
          const keys = result[0].keys;
          if (keys.length > 0) {
            const key = String(keys[0]);
            stats[key] = result[0].get(keys[0]).toNumber();
          }
        }
      } catch (error) {
        console.error(`Error executing stats query: ${query}`, error);
      }
    }

    return stats;
  }

  // Clean up user data (for development/testing)
  static async cleanupUserData(userId: string) {
    const query = `
      MATCH (u:User {id: $userId})
      DETACH DELETE u
    `;
    
    return await neo4jConnection.executeWriteQuery(query, { userId });
  }
}

// Helper function to check if Neo4j is configured
export function isNeo4jConfigured(): boolean {
  return !!(process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD);
}

export default neo4jConnection;