import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update educational institution
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate institution exists
    const existingInstitution = await prisma.educationalInstitution.findUnique({
      where: { id }
    });

    if (!existingInstitution) {
      return NextResponse.json({ error: 'Educational institution not found' }, { status: 404 });
    }

    // Validate institution type if provided
    const validTypes = ['university', 'college', 'community_college', 'trade_school', 'bootcamp', 'online_platform', 'other'];
    if (body.type && !validTypes.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid institution type' }, { status: 400 });
    }

    // Update institution
    const institution = await prisma.educationalInstitution.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.type && { type: body.type }),
        ...(body.country !== undefined && { country: body.country?.trim() || null }),
        ...(body.website !== undefined && { website: body.website?.trim() || null }),
        ...(body.isVerified !== undefined && { verified: body.isVerified })
      }
    });

    return NextResponse.json(institution);
  } catch (error) {
    console.error('Error updating educational institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete educational institution
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if institution is being used
    const usageCount = await prisma.userEducation.count({
      where: { institutionId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete institution. It is being used by ${usageCount} user(s).` 
      }, { status: 400 });
    }

    await prisma.educationalInstitution.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Educational institution deleted successfully' });
  } catch (error) {
    console.error('Error deleting educational institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}