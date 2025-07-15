import { NextResponse } from 'next/server';
import { ProfessionalGraphQueries } from '@/lib/neo4j';

export async function GET() {
  try {
    console.log('Testing Neo4j connection...');
    
    // Test basic connection
    const connectionTest = await ProfessionalGraphQueries.testConnection();
    
    if (!connectionTest) {
      return NextResponse.json({ 
        error: 'Neo4j connection failed',
        connected: false 
      }, { status: 500 });
    }

    // Initialize constraints
    await ProfessionalGraphQueries.initializeConstraints();

    // Get database stats
    const stats = await ProfessionalGraphQueries.getDatabaseStats();

    return NextResponse.json({ 
      message: 'Neo4j connection successful',
      connected: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Neo4j test failed:', error);
    return NextResponse.json({ 
      error: 'Neo4j test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      connected: false 
    }, { status: 500 });
  }
}