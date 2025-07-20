import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's working media
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const achievementId = url.searchParams.get('achievementId');

    let whereClause: any = {
      userId: user.id
    };

    if (projectId) {
      whereClause.projectId = projectId;
    } else if (achievementId) {
      whereClause.achievementId = achievementId;
    } else {
      // Get profile-level media (not attached to specific project or achievement)
      whereClause.projectId = null;
      whereClause.achievementId = null;
    }

    const media = await prisma.workingMedia.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' },
      include: {
        project: {
          select: { title: true }
        },
        achievement: {
          select: { title: true }
        }
      }
    });

    return NextResponse.json({
      media
    });

  } catch (error) {
    console.error('Error fetching working media:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Upload/Create working media
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    
    const { 
      mediaType,
      title,
      description,
      fileUrl,
      fileSize,
      mimeType,
      thumbnailUrl,
      projectId,
      achievementId,
      displayOrder
    } = body;

    // Validate required fields
    if (!mediaType || !title) {
      return NextResponse.json({ 
        error: 'Media type and title are required' 
      }, { status: 400 });
    }

    // Validate media type
    const validMediaTypes = ['video', 'image', 'document', 'presentation', 'code'];
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json({ 
        error: 'Invalid media type' 
      }, { status: 400 });
    }

    // Get the user's working profile
    const workingProfile = await prisma.workingProfile.findUnique({
      where: { userId: user.id }
    });

    if (!workingProfile) {
      return NextResponse.json({ 
        error: 'Working profile not found. Please create a working profile first.' 
      }, { status: 404 });
    }

    // If projectId or achievementId is provided, verify they belong to the user
    if (projectId) {
      const project = await prisma.workingProject.findFirst({
        where: {
          id: projectId,
          userId: user.id
        }
      });

      if (!project) {
        return NextResponse.json({ 
          error: 'Project not found or unauthorized' 
        }, { status: 404 });
      }
    }

    if (achievementId) {
      const achievement = await prisma.workingAchievement.findFirst({
        where: {
          id: achievementId,
          userId: user.id
        }
      });

      if (!achievement) {
        return NextResponse.json({ 
          error: 'Achievement not found or unauthorized' 
        }, { status: 404 });
      }
    }

    // Create the media entry
    const newMedia = await prisma.workingMedia.create({
      data: {
        userId: user.id,
        workingProfileId: workingProfile.id,
        mediaType,
        title,
        description,
        fileUrl,
        fileSize,
        mimeType,
        thumbnailUrl,
        projectId: projectId || null,
        achievementId: achievementId || null,
        displayOrder: displayOrder || 0
      }
    });

    return NextResponse.json({
      message: 'Media created successfully',
      media: newMedia
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating working media:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update working media
export async function PUT(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    
    const { 
      id,
      mediaType,
      title,
      description,
      fileUrl,
      fileSize,
      mimeType,
      thumbnailUrl,
      displayOrder
    } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'Media ID is required' 
      }, { status: 400 });
    }

    // Verify the media belongs to the user
    const existingMedia = await prisma.workingMedia.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingMedia) {
      return NextResponse.json({ 
        error: 'Media not found or unauthorized' 
      }, { status: 404 });
    }

    // Update the media
    const updatedMedia = await prisma.workingMedia.update({
      where: { id },
      data: {
        mediaType: mediaType || existingMedia.mediaType,
        title: title || existingMedia.title,
        description: description !== undefined ? description : existingMedia.description,
        fileUrl: fileUrl || existingMedia.fileUrl,
        fileSize: fileSize || existingMedia.fileSize,
        mimeType: mimeType || existingMedia.mimeType,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existingMedia.thumbnailUrl,
        displayOrder: displayOrder !== undefined ? displayOrder : existingMedia.displayOrder
      }
    });

    return NextResponse.json({
      message: 'Media updated successfully',
      media: updatedMedia
    });

  } catch (error) {
    console.error('Error updating working media:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete working media
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const url = new URL(request.url);
    const mediaId = url.searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json({ 
        error: 'Media ID is required' 
      }, { status: 400 });
    }

    // Verify the media belongs to the user
    const existingMedia = await prisma.workingMedia.findFirst({
      where: {
        id: mediaId,
        userId: user.id
      }
    });

    if (!existingMedia) {
      return NextResponse.json({ 
        error: 'Media not found or unauthorized' 
      }, { status: 404 });
    }

    // Delete the media
    await prisma.workingMedia.delete({
      where: { id: mediaId }
    });

    return NextResponse.json({
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting working media:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}