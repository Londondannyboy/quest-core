import { NextResponse } from 'next/server';

export async function GET() {
  const apifyToken = process.env.APIFY_TOKEN;
  const apifyApiKey = process.env.APIFY_API_KEY;
  const apifyUserId = process.env.APIFY_USER_ID;
  
  return NextResponse.json({
    hasApifyToken: !!apifyToken,
    hasApifyApiKey: !!apifyApiKey,
    hasApifyUserId: !!apifyUserId,
    tokenFirst10: apifyToken ? apifyToken.substring(0, 10) + '...' : 'NOT SET',
    apiKeyFirst10: apifyApiKey ? apifyApiKey.substring(0, 10) + '...' : 'NOT SET',
    userId: apifyUserId || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}