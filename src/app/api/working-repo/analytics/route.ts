import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch analytics for user's working profile
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    const workingProfile = await prisma.workingProfile.findUnique({
      where: { userId: user.id }
    });

    if (!workingProfile) {
      return NextResponse.json({ 
        error: 'Working profile not found' 
      }, { status: 404 });
    }

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);

    // Get access logs
    const accessLogs = await prisma.workingAccessLog.findMany({
      where: {
        workingProfileId: workingProfile.id,
        accessedAt: {
          gte: dateFilter
        }
      },
      orderBy: { accessedAt: 'desc' }
    });

    // Get active permissions
    const activePermissions = await prisma.workingAccessPermission.findMany({
      where: {
        workingProfileId: workingProfile.id,
        isRevoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    // Calculate analytics
    const totalViews = accessLogs.length;
    const uniqueViewers = new Set(accessLogs.map(log => log.accessedByEmail)).size;
    const viewsByDay: { [key: string]: number } = {};
    const viewersByEmail: { [key: string]: { name: string | null, count: number, lastAccess: Date } } = {};

    accessLogs.forEach(log => {
      const day = log.accessedAt.toISOString().split('T')[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;

      if (log.accessedByEmail) {
        if (!viewersByEmail[log.accessedByEmail]) {
          viewersByEmail[log.accessedByEmail] = {
            name: log.accessedByName,
            count: 0,
            lastAccess: log.accessedAt
          };
        }
        viewersByEmail[log.accessedByEmail].count++;
        if (log.accessedAt > viewersByEmail[log.accessedByEmail].lastAccess) {
          viewersByEmail[log.accessedByEmail].lastAccess = log.accessedAt;
        }
      }
    });

    // Get recent activity
    const recentActivity = accessLogs.slice(0, 10).map(log => ({
      viewerEmail: log.accessedByEmail,
      viewerName: log.accessedByName,
      accessedAt: log.accessedAt,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));

    return NextResponse.json({
      analytics: {
        totalViews,
        uniqueViewers,
        activePermissions: activePermissions.length,
        periodDays: days
      },
      viewsByDay,
      topViewers: Object.entries(viewersByEmail)
        .map(([email, data]) => ({ email, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentActivity,
      activePermissions: activePermissions.map(p => ({
        id: p.id,
        grantedToEmail: p.grantedToEmail,
        grantedToName: p.grantedToName,
        accessLevel: p.accessLevel,
        grantedAt: p.grantedAt,
        expiresAt: p.expiresAt
      }))
    });

  } catch (error) {
    console.error('Error fetching working profile analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}