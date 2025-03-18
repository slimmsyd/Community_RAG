import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import User from '@/app/api/models/User';
import Workspace from '@/app/api/models/Workspace';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/lib/authOptions";

export async function GET() {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email })
      .populate({
        path: 'workspaces.workspaceId',
        model: Workspace,
        select: 'name'
      });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workspaces: user.workspaces,
      primaryWorkspaceId: user.primaryWorkspaceId
    });
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 