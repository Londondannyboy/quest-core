import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    environment: {
      hasZepKey: !!process.env.ZEP_API_KEY,
      hasZebKey: !!process.env.zeb_api_key,
      zepKeyPrefix: process.env.ZEP_API_KEY?.substring(0, 10) + '...',
      zebKeyPrefix: process.env.zeb_api_key?.substring(0, 10) + '...',
      allZepKeys: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('zep') || key.toLowerCase().includes('zeb')
      )
    }
  });
}