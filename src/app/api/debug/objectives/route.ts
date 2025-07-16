import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Starting objectives debug ===');
    
    // Test 1: Check if user authentication works
    let user;
    try {
      const authResult = await getOrCreateUser();
      user = authResult.user;
      console.log('✅ User authenticated successfully:', user.id);
    } catch (error) {
      console.error('❌ User authentication failed:', error);
      return NextResponse.json({
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown auth error'
      }, { status: 401 });
    }

    // Test 2: Check if we can query the objectives table
    let objectivesCount;
    try {
      objectivesCount = await prisma.objective.count({
        where: { userId: user.id }
      });
      console.log('✅ Objectives table accessible, count:', objectivesCount);
    } catch (error) {
      console.error('❌ Objectives table query failed:', error);
      return NextResponse.json({
        error: 'Database table access failed',
        details: error instanceof Error ? error.message : 'Unknown database error'
      }, { status: 500 });
    }

    // Test 3: Check if we can create a simple objective
    let testObjective;
    try {
      testObjective = await prisma.objective.create({
        data: {
          userId: user.id,
          title: 'Test Objective',
          description: 'This is a test objective',
          category: 'professional',
          priority: 'medium',
          timeframe: 'quarter',
          status: 'active'
        }
      });
      console.log('✅ Test objective created successfully:', testObjective.id);
    } catch (error) {
      console.error('❌ Test objective creation failed:', error);
      return NextResponse.json({
        error: 'Objective creation failed',
        details: error instanceof Error ? error.message : 'Unknown creation error',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    // Test 4: Clean up - delete the test objective
    try {
      await prisma.objective.delete({
        where: { id: testObjective.id }
      });
      console.log('✅ Test objective deleted successfully');
    } catch (error) {
      console.error('❌ Test objective deletion failed:', error);
      // Don't return error here, just log it
    }

    // Test 5: Check database schema info
    let tableInfo;
    try {
      // This will show us what the actual table structure looks like
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'objectives'
        ORDER BY ordinal_position;
      `;
      tableInfo = result;
      console.log('✅ Objectives table schema:', tableInfo);
    } catch (error) {
      console.error('❌ Schema query failed:', error);
      tableInfo = 'Schema query failed';
    }

    return NextResponse.json({
      success: true,
      message: 'All debug tests passed!',
      data: {
        userId: user.id,
        objectivesCount,
        testObjectiveId: testObjective.id,
        tableSchema: tableInfo
      }
    });

  } catch (error) {
    console.error('❌ Debug API failed:', error);
    return NextResponse.json({
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Testing simple objective creation ===');
    
    const { user } = await getOrCreateUser();
    console.log('User ID:', user.id);
    
    const body = await request.json();
    console.log('Request body:', body);

    // Try creating with minimal data
    const objective = await prisma.objective.create({
      data: {
        userId: user.id,
        title: body.title || 'Default Title',
        status: 'active'
      }
    });

    console.log('✅ Simple objective created:', objective);
    
    return NextResponse.json({
      success: true,
      objective
    });

  } catch (error) {
    console.error('❌ Simple objective creation failed:', error);
    return NextResponse.json({
      error: 'Simple creation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}