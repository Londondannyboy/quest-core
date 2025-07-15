import { neo4jConnection } from './neo4j';

/**
 * Temporal Knowledge Graph Enhancement for Quest Core
 * 
 * This module extends the existing Neo4j schema with temporal capabilities
 * inspired by Graphiti's bi-temporal model, providing:
 * - t_valid: When an event actually occurred
 * - t_created: When the event was recorded in the system
 * - Point-in-time queries for career timeline visualization
 * - Temporal relationship strength calculation
 */

export interface TemporalEvent {
  id: string;
  type: 'job' | 'skill' | 'education' | 'certification' | 'project' | 'okr' | 'todo';
  userId: string;
  entityId: string;
  entityName: string;
  metadata: Record<string, any>;
  // Bi-temporal model
  t_valid: Date;     // When the event actually occurred
  t_invalid?: Date;  // When the event ended (if applicable)
  t_created: Date;   // When the event was recorded
  t_updated?: Date;  // When the event was last updated
}

export interface TimelinePosition {
  x: number; // Professional domain (-200 to 200)
  y: number; // Seniority level (0 to 200)
  z: number; // Time position (-500 to 500)
}

export interface TemporalGraphData {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: TimelinePosition;
    temporalMetadata: {
      t_valid: Date;
      t_invalid?: Date;
      t_created: Date;
      duration?: number; // in months
      isActive: boolean;
    };
    visualProperties: {
      color: string;
      size: number;
      opacity: number;
    };
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
    temporalMetadata: {
      t_valid: Date;
      t_invalid?: Date;
      overlapDuration?: number; // in months
    };
  }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class TemporalGraphManager {
  
  /**
   * Initialize temporal schema enhancements
   */
  static async initializeTemporalSchema() {
    console.log('Initializing temporal schema enhancements...');
    
    // Add temporal indexes for performance
    const temporalIndexes = [
      'CREATE INDEX temporal_event_valid_range IF NOT EXISTS FOR (e:TemporalEvent) ON (e.t_valid, e.t_invalid)',
      'CREATE INDEX temporal_event_type_date IF NOT EXISTS FOR (e:TemporalEvent) ON (e.type, e.t_valid)',
      'CREATE INDEX temporal_event_user_date IF NOT EXISTS FOR (e:TemporalEvent) ON (e.userId, e.t_valid)',
      'CREATE INDEX work_temporal_range IF NOT EXISTS FOR ()-[r:WORKED_AT]->() ON (r.t_valid, r.t_invalid)',
      'CREATE INDEX skill_temporal_range IF NOT EXISTS FOR ()-[r:HAS_SKILL]->() ON (r.t_valid, r.t_invalid)',
      'CREATE INDEX education_temporal_range IF NOT EXISTS FOR ()-[r:STUDIED_AT]->() ON (r.t_valid, r.t_invalid)'
    ];

    for (const index of temporalIndexes) {
      try {
        await neo4jConnection.executeWriteQuery(index);
        console.log(`Created temporal index: ${index}`);
      } catch (error) {
        console.log(`Temporal index may already exist: ${index}`);
      }
    }
  }

  /**
   * Add temporal event to the graph
   */
  static async addTemporalEvent(event: TemporalEvent) {
    const query = `
      MERGE (e:TemporalEvent {id: $id})
      SET e.type = $type,
          e.userId = $userId,
          e.entityId = $entityId,
          e.entityName = $entityName,
          e.metadata = $metadata,
          e.t_valid = datetime($t_valid),
          e.t_invalid = CASE WHEN $t_invalid IS NOT NULL THEN datetime($t_invalid) ELSE null END,
          e.t_created = datetime($t_created),
          e.t_updated = datetime()
      RETURN e
    `;

    return await neo4jConnection.executeWriteQuery(query, {
      id: event.id,
      type: event.type,
      userId: event.userId,
      entityId: event.entityId,
      entityName: event.entityName,
      metadata: event.metadata,
      t_valid: event.t_valid.toISOString(),
      t_invalid: event.t_invalid?.toISOString(),
      t_created: event.t_created.toISOString()
    });
  }

  /**
   * Get temporal timeline data for 3D visualization
   */
  static async getTemporalTimeline(userId: string, timeRange?: { start: Date; end: Date }): Promise<TemporalGraphData> {
    const timeFilter = timeRange ? 
      `AND e.t_valid >= datetime($startDate) AND e.t_valid <= datetime($endDate)` : '';
    
    const query = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[r:WORKED_AT]->(c:Company)
      WHERE r.startDate IS NOT NULL ${timeFilter.replace('e.t_valid', 'r.startDate')}
      OPTIONAL MATCH (u)-[s:HAS_SKILL]->(sk:Skill)
      WHERE s.acquiredDate IS NOT NULL ${timeFilter.replace('e.t_valid', 's.acquiredDate')}
      OPTIONAL MATCH (u)-[ed:STUDIED_AT]->(i:Institution)
      WHERE ed.startDate IS NOT NULL ${timeFilter.replace('e.t_valid', 'ed.startDate')}
      
      RETURN {
        workExperiences: collect(DISTINCT {
          id: c.id,
          name: c.name,
          type: 'company',
          relationship: r,
          startDate: r.startDate,
          endDate: r.endDate,
          title: r.title,
          industry: c.industry
        }),
        skills: collect(DISTINCT {
          id: sk.id,
          name: sk.name,
          type: 'skill',
          relationship: s,
          acquiredDate: s.acquiredDate,
          proficiencyLevel: s.proficiencyLevel,
          yearsOfExperience: s.yearsOfExperience
        }),
        education: collect(DISTINCT {
          id: i.id,
          name: i.name,
          type: 'institution',
          relationship: ed,
          startDate: ed.startDate,
          endDate: ed.endDate,
          degree: ed.degree,
          fieldOfStudy: ed.fieldOfStudy
        })
      } as timeline
    `;

    const parameters: any = { userId };
    if (timeRange) {
      parameters.startDate = timeRange.start.toISOString();
      parameters.endDate = timeRange.end.toISOString();
    }

    const result = await neo4jConnection.executeReadQuery(query, parameters);
    
    if (result.length === 0) {
      return {
        nodes: [],
        links: [],
        timeRange: { start: new Date(), end: new Date() }
      };
    }

    return this.transformToTemporalGraph(result[0].timeline, userId);
  }

  /**
   * Transform Neo4j results to temporal graph format
   */
  private static transformToTemporalGraph(timeline: any, userId: string): TemporalGraphData {
    const nodes: any[] = [];
    const links: any[] = [];
    const allDates: Date[] = [];

    // Add user node at center
    nodes.push({
      id: userId,
      name: 'You',
      type: 'user',
      position: { x: 0, y: 100, z: 0 },
      temporalMetadata: {
        t_valid: new Date(),
        t_created: new Date(),
        isActive: true
      },
      visualProperties: {
        color: '#3b82f6',
        size: 20,
        opacity: 1.0
      }
    });

    // Process work experiences
    timeline.workExperiences?.forEach((work: any) => {
      if (!work.startDate) return;
      
      const startDate = new Date(work.startDate);
      const endDate = work.endDate ? new Date(work.endDate) : new Date();
      allDates.push(startDate);
      if (work.endDate) allDates.push(endDate);

      const position = this.calculateTimelinePosition(startDate, work.type, work.title);
      
      nodes.push({
        id: work.id,
        name: work.name,
        type: 'company',
        position,
        temporalMetadata: {
          t_valid: startDate,
          t_invalid: work.endDate ? endDate : undefined,
          t_created: new Date(),
          duration: this.calculateDuration(startDate, endDate),
          isActive: !work.endDate
        },
        visualProperties: {
          color: '#10b981',
          size: 15,
          opacity: work.endDate ? 0.7 : 1.0
        }
      });

      links.push({
        source: userId,
        target: work.id,
        type: 'works_at',
        strength: this.calculateTemporalStrength(startDate, endDate),
        temporalMetadata: {
          t_valid: startDate,
          t_invalid: work.endDate ? endDate : undefined,
          overlapDuration: this.calculateDuration(startDate, endDate)
        }
      });
    });

    // Process skills
    timeline.skills?.forEach((skill: any) => {
      if (!skill.acquiredDate) return;
      
      const acquiredDate = new Date(skill.acquiredDate);
      allDates.push(acquiredDate);

      const position = this.calculateTimelinePosition(acquiredDate, skill.type, skill.proficiencyLevel);
      
      nodes.push({
        id: skill.id,
        name: skill.name,
        type: 'skill',
        position,
        temporalMetadata: {
          t_valid: acquiredDate,
          t_created: new Date(),
          isActive: true
        },
        visualProperties: {
          color: '#8b5cf6',
          size: 10 + (skill.yearsOfExperience || 0),
          opacity: 1.0
        }
      });

      links.push({
        source: userId,
        target: skill.id,
        type: 'has_skill',
        strength: Math.min((skill.yearsOfExperience || 1) / 5, 3),
        temporalMetadata: {
          t_valid: acquiredDate
        }
      });
    });

    // Process education
    timeline.education?.forEach((edu: any) => {
      if (!edu.startDate) return;
      
      const startDate = new Date(edu.startDate);
      const endDate = edu.endDate ? new Date(edu.endDate) : new Date();
      allDates.push(startDate);
      if (edu.endDate) allDates.push(endDate);

      const position = this.calculateTimelinePosition(startDate, edu.type, edu.degree);
      
      nodes.push({
        id: edu.id,
        name: edu.name,
        type: 'institution',
        position,
        temporalMetadata: {
          t_valid: startDate,
          t_invalid: edu.endDate ? endDate : undefined,
          t_created: new Date(),
          duration: this.calculateDuration(startDate, endDate),
          isActive: !edu.endDate
        },
        visualProperties: {
          color: '#f59e0b',
          size: 12,
          opacity: edu.endDate ? 0.8 : 1.0
        }
      });

      links.push({
        source: userId,
        target: edu.id,
        type: 'studied_at',
        strength: 2,
        temporalMetadata: {
          t_valid: startDate,
          t_invalid: edu.endDate ? endDate : undefined,
          overlapDuration: this.calculateDuration(startDate, endDate)
        }
      });
    });

    // Calculate time range
    const timeRange = allDates.length > 0 ? {
      start: new Date(Math.min(...allDates.map(d => d.getTime()))),
      end: new Date(Math.max(...allDates.map(d => d.getTime())))
    } : { start: new Date(), end: new Date() };

    return { nodes, links, timeRange };
  }

  /**
   * Calculate 3D timeline position
   */
  private static calculateTimelinePosition(date: Date, type: string, metadata?: string): TimelinePosition {
    // Z-axis: Time (past to present)
    const now = new Date();
    const start = new Date(2010, 0, 1); // Reference start date
    const timeRange = now.getTime() - start.getTime();
    const eventTime = date.getTime() - start.getTime();
    const z = ((eventTime / timeRange) * 1000) - 500; // -500 to 500 range

    // X-axis: Professional domain
    let x = 0;
    if (type === 'skill') {
      x = this.getDomainPosition(metadata); // -200 to 200
    } else if (type === 'company') {
      x = this.getDomainPosition(metadata); // Based on industry/role
    }

    // Y-axis: Seniority/Education level
    let y = 0;
    if (type === 'company') {
      y = this.getSeniorityLevel(metadata); // 0 to 200
    } else if (type === 'skill') {
      y = this.getSkillLevel(metadata); // 0 to 150
    } else if (type === 'institution') {
      y = this.getEducationLevel(metadata); // 50 to 100
    }

    return { x, y, z };
  }

  private static getDomainPosition(metadata?: string): number {
    if (!metadata) return 0;
    
    const engineering = ['software', 'developer', 'engineer', 'technical', 'programming', 'javascript', 'python', 'react'];
    const marketing = ['marketing', 'sales', 'business', 'manager', 'director', 'communication'];
    const finance = ['finance', 'accounting', 'analyst', 'financial', 'budget'];
    
    const meta = metadata.toLowerCase();
    
    if (engineering.some(term => meta.includes(term))) return -150;
    if (marketing.some(term => meta.includes(term))) return 150;
    if (finance.some(term => meta.includes(term))) return 0;
    
    return Math.random() * 200 - 100; // Random position if unclear
  }

  private static getSeniorityLevel(metadata?: string): number {
    if (!metadata) return 50;
    
    const meta = metadata.toLowerCase();
    if (meta.includes('junior') || meta.includes('intern')) return 20;
    if (meta.includes('senior') || meta.includes('lead')) return 120;
    if (meta.includes('director') || meta.includes('manager')) return 160;
    if (meta.includes('vp') || meta.includes('executive')) return 200;
    
    return 80; // Mid-level default
  }

  private static getSkillLevel(metadata?: string): number {
    if (!metadata) return 50;
    
    const meta = metadata.toLowerCase();
    if (meta.includes('beginner')) return 30;
    if (meta.includes('intermediate')) return 80;
    if (meta.includes('advanced')) return 120;
    if (meta.includes('expert')) return 150;
    
    return 80; // Default intermediate
  }

  private static getEducationLevel(metadata?: string): number {
    if (!metadata) return 75;
    
    const meta = metadata.toLowerCase();
    if (meta.includes('bachelor')) return 75;
    if (meta.includes('master')) return 90;
    if (meta.includes('phd') || meta.includes('doctorate')) return 100;
    
    return 75; // Default bachelor level
  }

  private static calculateDuration(startDate: Date, endDate: Date): number {
    const duration = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.round(duration / (1000 * 60 * 60 * 24 * 30)); // Duration in months
  }

  private static calculateTemporalStrength(startDate: Date, endDate: Date): number {
    const duration = this.calculateDuration(startDate, endDate);
    return Math.min(duration / 12, 5); // Max strength of 5 for 5+ years
  }

  /**
   * Query temporal graph for specific time range
   */
  static async queryTemporalRange(userId: string, startDate: Date, endDate: Date): Promise<TemporalGraphData> {
    return this.getTemporalTimeline(userId, { start: startDate, end: endDate });
  }

  /**
   * Get career progression insights
   */
  static async getCareerProgression(userId: string): Promise<{
    skillProgression: Array<{ skill: string; timeline: Date[]; proficiencyGrowth: string[] }>;
    careerPath: Array<{ company: string; role: string; startDate: Date; endDate?: Date }>;
    educationImpact: Array<{ education: string; followingOpportunities: string[] }>;
  }> {
    const query = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[w:WORKED_AT]->(c:Company)
      OPTIONAL MATCH (u)-[s:HAS_SKILL]->(sk:Skill)
      OPTIONAL MATCH (u)-[e:STUDIED_AT]->(i:Institution)
      
      RETURN {
        workHistory: collect(DISTINCT {
          company: c.name,
          role: w.title,
          startDate: w.startDate,
          endDate: w.endDate
        }),
        skillHistory: collect(DISTINCT {
          skill: sk.name,
          acquiredDate: s.acquiredDate,
          proficiencyLevel: s.proficiencyLevel,
          yearsOfExperience: s.yearsOfExperience
        }),
        educationHistory: collect(DISTINCT {
          institution: i.name,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          startDate: e.startDate,
          endDate: e.endDate
        })
      } as progression
    `;

    const result = await neo4jConnection.executeReadQuery(query, { userId });
    
    if (result.length === 0) {
      return { skillProgression: [], careerPath: [], educationImpact: [] };
    }

    const progression = result[0].progression;
    
    // Process skill progression
    const skillProgression = progression.skillHistory
      .filter((skill: any) => skill.acquiredDate)
      .map((skill: any) => ({
        skill: skill.skill,
        timeline: [new Date(skill.acquiredDate)],
        proficiencyGrowth: [skill.proficiencyLevel]
      }));

    // Process career path
    const careerPath = progression.workHistory
      .filter((work: any) => work.startDate)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map((work: any) => ({
        company: work.company,
        role: work.role,
        startDate: new Date(work.startDate),
        endDate: work.endDate ? new Date(work.endDate) : undefined
      }));

    // Process education impact
    const educationImpact = progression.educationHistory
      .filter((edu: any) => edu.startDate)
      .map((edu: any) => ({
        education: `${edu.degree} in ${edu.fieldOfStudy}`,
        followingOpportunities: [] // TODO: Implement correlation analysis
      }));

    return { skillProgression, careerPath, educationImpact };
  }
}