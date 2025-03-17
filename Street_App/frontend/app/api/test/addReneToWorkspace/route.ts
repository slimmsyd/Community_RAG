import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/app/api/models/User';
import Workspace from '@/app/api/models/Workspace';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    // Constants for Rene and workspace
    const RENE_ID = '678077e3f16bfcdcd98fb192';
    const WORKSPACE_ID = '67818e488a0a9d7c443fc89d';

    // 1. Add Rene to workspace members
    const workspaceUpdate = await Workspace.findByIdAndUpdate(
      WORKSPACE_ID,
      {
        $addToSet: {
          members: {
            userId: new mongoose.Types.ObjectId(RENE_ID),
            role: 'member',
            joinedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!workspaceUpdate) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // 2. Add workspace to Rene's workspaces
    const userUpdate = await User.findByIdAndUpdate(
      RENE_ID,
      {
        $addToSet: {
          workspaces: {
            workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID),
            role: 'member',
            joinedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!userUpdate) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Verify the updates by fetching the complete data
    const verifyWorkspace = await Workspace.findById(WORKSPACE_ID)
      .populate('members.userId', 'name email');
    
    const verifyUser = await User.findById(RENE_ID)
      .populate('workspaces.workspaceId', 'name');

    return NextResponse.json({
      success: true,
      message: 'Rene has been added to the workspace',
      verification: {
        workspace: {
          name: verifyWorkspace?.name,
          members: verifyWorkspace?.members
        },
        user: {
          name: verifyUser?.name,
          workspaces: verifyUser?.workspaces
        }
      }
    });

  } catch (error: any) {
    console.error('Error adding Rene to workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 