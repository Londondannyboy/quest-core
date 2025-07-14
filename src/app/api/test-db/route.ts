import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stats = {
      users: await prisma.user.count(),
      conversations: await prisma.conversation.count(),
      messages: await prisma.message.count(),
      trinityStatements: await prisma.trinityStatement.count(),
      skills: await prisma.skill.count()
    };
    
    return NextResponse.json({
      status: 'connected',
      database: 'Neon PostgreSQL',
      stats
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}