import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import User from '@/app/api/models/User';
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
    
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        birthDay: user.birthDay,
        maritalStatus: user.maritalStatus,
        location: user.location,
        bio: user.bio,
        interests: user.interests,
        milestones: user.milestones,
        familyRole: user.familyRole,
        contributions: user.contributions,
        workspaces: user.workspaces,
        primaryWorkspaceId: user.primaryWorkspaceId
      }
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 