import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Workspace from '@/app/api/models/Workspace';
import User from '@/app/api/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, ownerId } = body;


    console.log("Creating workspace with name:", name, "and ownerId:", ownerId);

    // Create the workspace
    const workspace = await Workspace.create({
      name,
      ownerId,
      members: [{
        userId: ownerId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    console.log("Workspace created:", workspace);

    // Update the owner's user document
    await User.findByIdAndUpdate(ownerId, {
      $push: {
        workspaces: {
          workspaceId: workspace._id,
          role: 'admin', //TODO: change to familyRole
          joinedAt: new Date()
        }
      },
      $set: { primaryWorkspaceId: workspace._id }
    });

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 