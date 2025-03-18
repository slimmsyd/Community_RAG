import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Invitation from '@/models/Invitation';
import Workspace from '@/models/Workspace';
import User from '@/models/User';
import mongoose, { ClientSession } from 'mongoose';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  let session: ClientSession | undefined;
  try {
    await dbConnect();
    const { token } = params;
    const { userId } = await request.json();

    console.log('Processing invitation acceptance:', { token, userId });

    // Find and validate invitation without session first
    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) {
      console.log('Invitation not found or not pending');
      return NextResponse.json(
        { success: false, error: 'Invalid or already accepted invitation' },
        { status: 404 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      console.log('Invitation expired');
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Convert IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const workspaceObjectId = new mongoose.Types.ObjectId(invitation.workspaceId);

    // Verify user and workspace exist before starting transaction
    const [workspace, user] = await Promise.all([
      Workspace.findById(workspaceObjectId),
      User.findById(userObjectId)
    ]);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(
      (m: any) => m.userId.toString() === userObjectId.toString()
    );

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this workspace' },
        { status: 400 }
      );
    }

    // Start transaction
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Add user to workspace members
      const newMember = {
        userId: userObjectId,
        role: 'member',
        joinedAt: new Date()
      };
      workspace.members.push(newMember);

      // Add workspace to user's workspaces
      user.workspaces = user.workspaces || [];
      user.workspaces.push({
        workspaceId: workspaceObjectId,
        role: 'member',
        joinedAt: new Date()
      });

      // Update invitation status
      invitation.status = 'accepted';

      // Save all changes
      await Promise.all([
        workspace.save({ session }),
        user.save({ session }),
        invitation.save({ session })
      ]);
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined workspace'
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Failed to process workspace invitation'
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
} 