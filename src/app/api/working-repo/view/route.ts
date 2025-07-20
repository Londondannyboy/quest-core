import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - View working profile via access token (no auth required)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const accessToken = url.searchParams.get('token');

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Access token is required' 
      }, { status: 400 });
    }

    // Find the access permission
    const permission = await prisma.workingAccessPermission.findUnique({
      where: { 
        accessToken,
        isRevoked: false
      },
      include: {
        profile: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            workingProjects: {
              include: {
                company: true,
                workingMedia: {
                  orderBy: { displayOrder: 'asc' }
                }
              },
              orderBy: { displayOrder: 'asc' }
            },
            workingAchievements: {
              include: {
                workingMedia: {
                  orderBy: { displayOrder: 'asc' }
                }
              },
              orderBy: { displayOrder: 'asc' }
            },
            workingMedia: {
              where: {
                projectId: null,
                achievementId: null
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json({ 
        error: 'Invalid or expired access token' 
      }, { status: 404 });
    }

    // Check if access has expired
    if (permission.expiresAt && permission.expiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'Access token has expired' 
      }, { status: 403 });
    }

    // Log the access
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIP || 'unknown';

    await prisma.workingAccessLog.create({
      data: {
        workingProfileId: permission.workingProfileId,
        accessedByEmail: permission.grantedToEmail,
        accessedByName: permission.grantedToName,
        accessToken: accessToken,
        ipAddress: ipAddress,
        userAgent: userAgent
      }
    });

    // Filter content based on access level
    const { profile } = permission;
    let filteredProfile = profile;

    switch (permission.accessLevel) {
      case 'recruiter':
        // Limited access - only basic info and selected projects
        filteredProfile = {
          ...profile,
          workingProjects: profile.workingProjects.filter(p => p.projectType === 'Professional').slice(0, 3),
          workingAchievements: profile.workingAchievements.slice(0, 2)
        };
        break;
      
      case 'collaborator':
        // Extended access - full projects but limited achievements
        filteredProfile = {
          ...profile,
          workingAchievements: profile.workingAchievements.slice(0, 5)
        };
        break;
      
      case 'mentor':
      case 'full':
        // Full access - no filtering
        break;
      
      default:
        // Default to recruiter level
        filteredProfile = {
          ...profile,
          workingProjects: profile.workingProjects.filter(p => p.projectType === 'Professional').slice(0, 3),
          workingAchievements: profile.workingAchievements.slice(0, 2)
        };
    }

    return NextResponse.json({
      profile: filteredProfile,
      accessLevel: permission.accessLevel,
      viewerEmail: permission.grantedToEmail,
      viewerName: permission.grantedToName
    });

  } catch (error) {
    console.error('Error viewing working profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}