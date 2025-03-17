import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/api/models/User';

// Temporary connection function until we set up proper auth
async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    await connectToDatabase();
    
    console.log('Setting relation - Workspace ID:', params.id, 'Target Member ID:', params.memberId);

    const currentUser = await User.findOne({ email: "ssanderss444@gmail.com" });
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const targetMember = await User.findById(params.memberId);
    if (!targetMember) {
      return NextResponse.json({ success: false, error: 'Target member not found' }, { status: 404 });
    }

    const { relationshipType } = await request.json();
    console.log('Requested relationship type:', relationshipType);

    // Find the workspace in current user's workspaces
    const currentUserWorkspace = currentUser.workspaces.find(
      (w: any) => w.workspaceId.toString() === params.id
    );

    if (!currentUserWorkspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    console.log('Current user workspace before update:', JSON.stringify(currentUserWorkspace, null, 2));

    // Initialize familyRelations if it doesn't exist
    if (!currentUserWorkspace.familyRelations) {
      currentUserWorkspace.familyRelations = [];
    }

    // Update or add the relationship in current user's workspace
    const existingRelationIndex = currentUserWorkspace.familyRelations.findIndex(
      (r: any) => r.relatedUser.toString() === params.memberId
    );

    if (existingRelationIndex !== -1) {
      currentUserWorkspace.familyRelations[existingRelationIndex].relationshipType = relationshipType;
      console.log('Updated existing relation for current user:', {
        relatedUser: params.memberId,
        relationshipType
      });
    } else {
      currentUserWorkspace.familyRelations.push({
        relatedUser: params.memberId,
        relationshipType
      });
      console.log('Added new relation for current user:', {
        relatedUser: params.memberId,
        relationshipType
      });
    }

    // Find the target member's workspace
    const targetMemberWorkspace = targetMember.workspaces.find(
      (w: any) => w.workspaceId.toString() === params.id
    );

    if (!targetMemberWorkspace) {
      return NextResponse.json({ success: false, error: 'Target member workspace not found' }, { status: 404 });
    }

    console.log('Target member workspace before update:', JSON.stringify(targetMemberWorkspace, null, 2));

    // Initialize familyRelations for target member if it doesn't exist
    if (!targetMemberWorkspace.familyRelations) {
      targetMemberWorkspace.familyRelations = [];
    }

    // Update or add the inverse relationship in target member's workspace
    const inverseRelationType = getInverseRelationType(relationshipType);
    const existingInverseRelationIndex = targetMemberWorkspace.familyRelations.findIndex(
      (r: any) => r.relatedUser.toString() === currentUser._id.toString()
    );

    if (existingInverseRelationIndex !== -1) {
      targetMemberWorkspace.familyRelations[existingInverseRelationIndex].relationshipType = inverseRelationType;
      console.log('Updated existing inverse relation for target member:', {
        relatedUser: currentUser._id,
        relationshipType: inverseRelationType
      });
    } else {
      targetMemberWorkspace.familyRelations.push({
        relatedUser: currentUser._id,
        relationshipType: inverseRelationType
      });
      console.log('Added new inverse relation for target member:', {
        relatedUser: currentUser._id,
        relationshipType: inverseRelationType
      });
    };

    

    // Update the workspaces arrays
    const currentUserWorkspaceIndex = currentUser.workspaces.findIndex(
      (w: any) => w.workspaceId.toString() === params.id
    );

    // Create a new workspace object that preserves all existing fields
    const updatedCurrentUserWorkspace = {
      ...currentUser.workspaces[currentUserWorkspaceIndex].toObject(),
      familyRelations: currentUserWorkspace.familyRelations
    };
    currentUser.workspaces[currentUserWorkspaceIndex] = updatedCurrentUserWorkspace;

    const targetMemberWorkspaceIndex = targetMember.workspaces.findIndex(
      (w: any) => w.workspaceId.toString() === params.id
    );

    // Create a new workspace object that preserves all existing fields
    const updatedTargetMemberWorkspace = {
      ...targetMember.workspaces[targetMemberWorkspaceIndex].toObject(),
      familyRelations: targetMemberWorkspace.familyRelations
    };
    targetMember.workspaces[targetMemberWorkspaceIndex] = updatedTargetMemberWorkspace;

    console.log('About to save users with updated workspaces');
    console.log('Current user workspace after update:', JSON.stringify(updatedCurrentUserWorkspace, null, 2));
    console.log('Target member workspace after update:', JSON.stringify(updatedTargetMemberWorkspace, null, 2));

    try {
      // Save both users
      await currentUser.save();
      await targetMember.save();
      console.log('Successfully saved relationship updates for both users');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error saving users:', error);
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error saving relationship changes'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error setting relation:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function getInverseRelationType(relationType: string): string {
  const inverseMap: { [key: string]: string } = {
    parent: 'child',
    child: 'parent',
    sibling: 'sibling',
    spouse: 'spouse',
    cousin: 'cousin',
    aunt: 'nephew',
    uncle: 'nephew',
    niece: 'uncle',
    nephew: 'aunt',
    grandparent: 'grandchild',
    grandchild: 'grandparent'
  };

  return inverseMap[relationType] || 'other';
} 