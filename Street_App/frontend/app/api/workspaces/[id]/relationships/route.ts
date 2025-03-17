import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FamilyRelationship from '@/app/api/models/FamilyRelationship';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/lib/authOptions';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    console.log('Fetching relationships for workspace:', params.id);

    // Get all active relationships in the workspace
    const relationships = await FamilyRelationship.find({
      workspaceId: params.id,
      isActive: true
    }).populate('fromUserId toUserId');

    console.log('Found relationships:', JSON.stringify(relationships, null, 2));

    return NextResponse.json({
      success: true,
      relationships
    });

  } catch (error) {
    console.error('Error fetching relationships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
} 