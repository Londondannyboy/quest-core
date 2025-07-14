import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update company
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Update company
    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.website !== undefined && { website: body.website?.trim() || null }),
        ...(body.industry !== undefined && { industry: body.industry?.trim() || null }),
        ...(body.isVerified !== undefined && { isVerified: body.isVerified })
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete company
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if company is being used
    const usageCount = await prisma.workExperience.count({
      where: { companyId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete company. It is being used in ${usageCount} work experience(s).` 
      }, { status: 400 });
    }

    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}