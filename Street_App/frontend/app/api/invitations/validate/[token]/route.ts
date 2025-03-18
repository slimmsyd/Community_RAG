import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Invitation from '@/utils/models/Invitation';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    await dbConnect();
    const { token } = params;

    // Find the invitation
    const invitation = await Invitation.findOne({ token }).populate({
      path: 'workspaceId',
      select: 'name'
    }).populate({
      path: 'inviterId',
      select: 'name email'
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation has already been used
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        workspace: {
          id: invitation.workspaceId._id,
          name: invitation.workspaceId.name
        },
        inviter: {
          name: invitation.inviterId.name,
          email: invitation.inviterId.email
        },
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
} 