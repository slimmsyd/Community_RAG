import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Workspace from '@/app/api/models/Workspace';
import User from '@/app/api/models/User';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();
    const { userId } = params;

    console.log('Fetching workspace for user ID:', userId);

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find workspace where the user is either the owner or a member
    const workspace = await Workspace.findOne({
      $or: [
        { ownerId: userObjectId },
        { 'members.userId': userObjectId }
      ]
    }).populate({
      path: 'members.userId',
      model: User,
      select: 'name email profileImage familyRole _id familyConnections',
      populate: {
        path: 'familyConnections.relatedUserId',
        model: 'User',
        select: 'name email profileImage'
      }
    }).populate({
      path: 'ownerId',
      model: User,
      select: 'name email profileImage familyRole _id familyConnections',
      populate: {
        path: 'familyConnections.relatedUserId',
        model: 'User',
        select: 'name email profileImage'
      }
    });

    console.log('Found workspace:', JSON.stringify(workspace, null, 2));

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'No workspace found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workspace
    });
  } catch (error: any) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 