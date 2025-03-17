import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Workspace from '@/app/api/models/Workspace';
import User from '@/app/api/models/User';
import Invitation from '@/app/api/models/Invitation';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    // Log email config
    console.log('Email Configuration:', {
      user: 'sales@kinnected.life',
      from: process.env.SMTP_FROM_EMAIL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { workspaceId, email, message } = await req.json();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to invite
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const userMembership = workspace.members.find(
      (m: any) => m.userId.toString() === currentUser._id.toString()
    );

    if (!userMembership || !['admin', 'member'].includes(userMembership.role)) {
      return NextResponse.json({ success: false, error: 'Not authorized to invite members' }, { status: 403 });
    }

    // Check if invitee is already a member
    const existingMember = workspace.members.find(
      (m: any) => m.email === email
    );
    if (existingMember) {
      return NextResponse.json({ success: false, error: 'User is already a member' }, { status: 400 });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation record
    const invitation = await Invitation.create({
      workspaceId,
      inviterId: currentUser._id,
      email,
      token,
      expiresAt
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${token}`;
    
    // Send invitation email using our utility
    const emailResult = await sendEmail({
      to: email,
      subject: `You're invited to join ${workspace.name} on Kinnected`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <img src="https://kinnected.life/assets/KinnectLogo.png" alt="Kinnected Logo" style="width: 150px; margin-bottom: 20px;">
          <h2 style="color: #111827; margin-bottom: 16px;">You're invited to join ${workspace.name}</h2>
          <p style="color: #4b5563; margin-bottom: 16px;">${currentUser.name} has invited you to join their family workspace on Kinnected.</p>
          ${message ? `
            <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
              <p style="color: #6b7280; margin-bottom: 8px;">Message from ${currentUser.name}:</p>
              <p style="color: #111827;">${message}</p>
            </div>
          ` : ''}
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background-color: #3B35C3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days.</p>
          <p style="color: #6b7280; font-size: 14px;">If you don't have an account yet, you'll be able to create one after accepting the invitation.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      throw new Error('Failed to send invitation email');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
} 