import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  });
}