import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongoose';
import User from '@/app/api/models/User';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    await connectToDatabase();
    const walletAddress = decodeURIComponent(params.address);
    
    const user = await User.findOne({ walletAddress })
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
        walletAddress: user.walletAddress,
        profileImage: user.profileImage,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        birthDay: user.birthDay,
        maritalStatus: user.maritalStatus,
        location: user.location,
        gender: user.gender,
        bio: user.bio,
        interests: user.interests,
        milestones: user.milestones,
        familyRole: user.familyRole,
        contributions: user.contributions,
        familyConnections: user.familyConnections,
        settings: user.settings,
        workspaces: user.workspaces,
        primaryWorkspaceId: user.primaryWorkspaceId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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
  { params }: { params: { address: string } }
) {
  try {
    await connectToDatabase();
    const walletAddress = decodeURIComponent(params.address);
    const body = await request.json();

    // Try to find existing user first
    let user = await User.findOne({ walletAddress });

    if (!user) {
      // If no user exists with this wallet, create a new one
      user = new User({
        walletAddress,
        ...body
      });
    } else {
      // Update existing user
      Object.assign(user, body);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        profileImage: user.profileImage,
        familyRole: user.familyRole,
        // Include other fields as needed
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