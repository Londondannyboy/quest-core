import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// GET - Fetch access permissions for user's working profile
export async function GET() {
  try {
    const { user } = await getOrCreateUser();

    const workingProfile = await prisma.workingProfile.findUnique({
      where: { userId: user.id },
      include: {
        workingAccessPermissions: {
          where: { isRevoked: false },
          orderBy: { grantedAt: 'desc' }
        }
      }
    });

    if (!workingProfile) {
      return NextResponse.json({ 
        error: 'Working profile not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      permissions: workingProfile.workingAccessPermissions
    });

  } catch (error) {
    console.error('Error fetching access permissions:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Grant access permission
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    
    const { 
      grantedToEmail, 
      grantedToName, 
      accessLevel,
      expiresAt 
    } = body;

    // Validate required fields
    if (!grantedToEmail || !accessLevel) {
      return NextResponse.json({ 
        error: 'Email and access level are required' 
      }, { status: 400 });
    }

    // Validate access level
    const validAccessLevels = ['recruiter', 'collaborator', 'mentor', 'full'];
    if (!validAccessLevels.includes(accessLevel)) {
      return NextResponse.json({ 
        error: 'Invalid access level' 
      }, { status: 400 });
    }

    const workingProfile = await prisma.workingProfile.findUnique({
      where: { userId: user.id }
    });

    if (!workingProfile) {
      return NextResponse.json({ 
        error: 'Working profile not found' 
      }, { status: 404 });
    }

    // Generate secure access token
    const accessToken = randomBytes(32).toString('hex');

    // Check if permission already exists for this email
    const existingPermission = await prisma.workingAccessPermission.findFirst({
      where: {
        workingProfileId: workingProfile.id,
        grantedToEmail: grantedToEmail,
        isRevoked: false
      }
    });

    if (existingPermission) {
      // Update existing permission
      const updatedPermission = await prisma.workingAccessPermission.update({
        where: { id: existingPermission.id },
        data: {
          grantedToName,
          accessLevel,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          accessToken
        }
      });

      return NextResponse.json({
        message: 'Access permission updated successfully',
        permission: updatedPermission
      });
    } else {
      // Create new permission
      const newPermission = await prisma.workingAccessPermission.create({
        data: {
          workingProfileId: workingProfile.id,
          grantedToEmail,
          grantedToName,
          accessLevel,
          grantedBy: user.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          accessToken
        }
      });

      return NextResponse.json({
        message: 'Access permission granted successfully',
        permission: newPermission
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error granting access permission:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Revoke access permission
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const url = new URL(request.url);
    const permissionId = url.searchParams.get('id');

    if (!permissionId) {
      return NextResponse.json({ 
        error: 'Permission ID is required' 
      }, { status: 400 });
    }

    // Verify the permission belongs to the user
    const permission = await prisma.workingAccessPermission.findFirst({
      where: {
        id: permissionId,
        grantedBy: user.id
      }
    });

    if (!permission) {
      return NextResponse.json({ 
        error: 'Permission not found or unauthorized' 
      }, { status: 404 });
    }

    // Revoke permission (soft delete)
    await prisma.workingAccessPermission.update({
      where: { id: permissionId },
      data: { isRevoked: true }
    });

    return NextResponse.json({
      message: 'Access permission revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking access permission:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}