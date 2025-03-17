import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Workspace from '@/app/api/models/Workspace';
import User from '@/app/api/models/User';

interface WorkspaceMember {
  userId: {
    name: string;
    familyConnections?: Array<{
      relatedUserId: string;
      relationship: string;
      confirmed: boolean;
    }>;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const workspace = await Workspace.findById(params.id)
      .populate({
        path: 'members.userId',
        model: 'User',
        select: 'name email profileImage familyRole familyConnections'
      });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    // console.log('Workspace members with family connections:', workspace.members.map((m: WorkspaceMember) => ({
    //   name: m.userId.name,
    //   familyConnections: m.userId.familyConnections
    // })));

    return NextResponse.json({ success: true, workspace });

  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch workspace members' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const workspaceId = params.id;
    const { userId, role = 'member' } = await request.json();

    // Find the workspace and update members
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Add member to workspace
    workspace.members.push({
      userId,
      role,
      joinedAt: new Date()
    });
    await workspace.save();

    // Update user's workspaces array
    await User.findByIdAndUpdate(userId, {
      $push: {
        workspaces: {
          workspaceId: workspaceId,
          role: role,
          joinedAt: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Member added successfully'
    });

  } catch (error: any) {
    console.error('Error adding workspace member:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 