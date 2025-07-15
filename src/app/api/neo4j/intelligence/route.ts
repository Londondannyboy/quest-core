import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { ProfessionalGraphQueries, neo4jConnection } from '@/lib/neo4j';

// GET - Get professional intelligence insights
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type');

    let result;

    switch (queryType) {
      case 'network':
        result = await ProfessionalGraphQueries.getUserProfessionalNetwork(user.user.id);
        break;
        
      case 'colleagues':
        result = await ProfessionalGraphQueries.getProfessionalColleagues(user.user.id);
        break;
        
      case 'career-paths':
        const fromRole = searchParams.get('from') || '';
        const toRole = searchParams.get('to') || '';
        if (fromRole && toRole) {
          result = await ProfessionalGraphQueries.findCareerPaths(fromRole, toRole);
        } else {
          return NextResponse.json({ error: 'Missing from/to parameters for career paths' }, { status: 400 });
        }
        break;
        
      case 'skill-migration':
        const skillName = searchParams.get('skill') || '';
        if (skillName) {
          result = await ProfessionalGraphQueries.findSkillMigrationPatterns(skillName);
        } else {
          return NextResponse.json({ error: 'Missing skill parameter' }, { status: 400 });
        }
        break;
        
      case 'stats':
        result = await ProfessionalGraphQueries.getDatabaseStats();
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid query type' }, { status: 400 });
    }

    return NextResponse.json({
      queryType,
      data: result,
      userId: user.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing Neo4j intelligence query:', error);
    return NextResponse.json({ 
      error: 'Failed to execute intelligence query',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Execute custom Cypher queries (for advanced analysis)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Custom queries not allowed in production' }, { status: 403 });
    }

    const user = await getOrCreateUser();
    const body = await request.json();
    const { query, parameters = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    // Security: Only allow READ queries
    const uppercaseQuery = query.toUpperCase().trim();
    if (uppercaseQuery.startsWith('CREATE') || 
        uppercaseQuery.startsWith('DELETE') || 
        uppercaseQuery.startsWith('SET') || 
        uppercaseQuery.startsWith('MERGE') ||
        uppercaseQuery.startsWith('REMOVE')) {
      return NextResponse.json({ error: 'Only READ queries allowed' }, { status: 403 });
    }

    const result = await neo4jConnection.executeReadQuery(query, { ...parameters, userId: user.user.id });

    return NextResponse.json({
      query,
      parameters,
      result: result.map(record => {
        const obj: Record<string, any> = {};
        record.keys.forEach(key => {
          obj[String(key)] = record.get(key);
        });
        return obj;
      }),
      resultCount: result.length,
      userId: user.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error executing custom Neo4j query:', error);
    return NextResponse.json({ 
      error: 'Failed to execute custom query',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}