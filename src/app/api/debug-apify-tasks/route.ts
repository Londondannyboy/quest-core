import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    
    if (!apiKey || apiKey === 'your_apify_api_key_here') {
      return NextResponse.json({
        error: 'APIFY_API_KEY is missing or placeholder'
      }, { status: 500 });
    }

    // List actor tasks
    const tasksResponse = await fetch('https://api.apify.com/v2/actor-tasks', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!tasksResponse.ok) {
      const error = await tasksResponse.text();
      return NextResponse.json({
        error: `Failed to fetch tasks: ${tasksResponse.status} ${error}`
      }, { status: 500 });
    }

    const tasksData = await tasksResponse.json();
    
    // Also list available actors
    const actorsResponse = await fetch('https://api.apify.com/v2/acts?my=1', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    let actorsData = null;
    if (actorsResponse.ok) {
      actorsData = await actorsResponse.json();
    }

    return NextResponse.json({
      success: true,
      tasks: tasksData.data?.map((task: any) => ({
        id: task.id,
        name: task.name,
        actorId: task.actorId,
        actorName: task.actorUsername + '/' + task.actorName
      })) || [],
      actors: actorsData?.data?.map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        username: actor.username,
        fullName: actor.username + '/' + actor.name
      })) || [],
      currentTaskIds: {
        HARVEST_LINKEDIN_PROFILE: 'l4Rzg56H5cbFETmgx',
        HARVEST_LINKEDIN_EMPLOYEES: 'Z4hQMjDxMd5Gk4Cmj'
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}