import { NextResponse } from 'next/server';

// Debug endpoint to check environment variables (REMOVE THIS IN PRODUCTION)
export async function GET() {
  const dbUrl = process.env.NEON_QUEST_CORE_DATABASE_URL;
  const directUrl = process.env.NEON_QUEST_CORE_DIRECT_URL;
  
  return NextResponse.json({
    hasDbUrl: !!dbUrl,
    dbUrlPrefix: dbUrl?.substring(0, 20) + '...',
    hasDirectUrl: !!directUrl,
    directUrlPrefix: directUrl?.substring(0, 20) + '...',
    nodeEnv: process.env.NODE_ENV
  });
}