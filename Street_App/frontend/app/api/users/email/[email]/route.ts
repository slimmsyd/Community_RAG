import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongoose';
import { User } from '@/models';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    await connectToDatabase();
    const email = decodeURIComponent(params.email);
    
    const user = await User.findOne({ email })
      .populate({
        path: 'familyConnections.relatedUserId',
        model: 'User',
        select: 'name email profileImage'
      });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
        role: user.role,
        familyConnections: user.familyConnections,
        settings: user.settings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        primaryWorkspaceId: user.primaryWorkspaceId,
        workspaces: user.workspaces
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    await connectToDatabase();
    const email = decodeURIComponent(params.email);
    const body = await request.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update user fields
    Object.assign(user, body);
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        familyRole: user.familyRole,
        // Add other fields as needed
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    }, { status: 500 });
  }
} 