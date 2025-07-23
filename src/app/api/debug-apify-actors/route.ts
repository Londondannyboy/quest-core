import { NextResponse } from 'next/server';
import { apifyClient } from '@/lib/scrapers/apify-client';

export async function GET() {
  try {
    console.log('[Debug Apify Actors] Listing available actors...');
    
    // Test connection first
    const userInfo = await apifyClient.testConnection();
    console.log('[Debug Apify Actors] User info:', userInfo);
    
    // List available actors
    const actors: any = await apifyClient.listActors();
    console.log('[Debug Apify Actors] Raw actors response:', actors);
    
    // Handle different response formats
    const actorsList = Array.isArray(actors) ? actors : 
                      (actors?.data?.items || actors?.items || []);
    
    return NextResponse.json({
      success: true,
      userInfo,
      rawActorsResponse: actors, // Include raw response for debugging
      totalActors: actorsList.length,
      actors: actorsList.map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        username: actor.username,
        title: actor.title,
        description: actor.description?.substring(0, 100) + '...',
        isPublic: actor.isPublic,
        createdAt: actor.createdAt
      }))
    });
    
  } catch (error) {
    console.error('[Debug Apify Actors] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to list actors',
      details: String(error)
    }, { status: 500 });
  }
}