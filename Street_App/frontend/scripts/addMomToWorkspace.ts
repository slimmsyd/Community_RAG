import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import User from '../app/api/models/User';
import Workspace from '../app/api/models/Workspace';
import FamilyRelationship from '../app/api/models/FamilyRelationship';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

async function addMomToWorkspace() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // 1. Create Mom user
    const momUser = await User.create({
      email: "shawn.sanders@example.com",
      name: "Shawn Small Sanders",
      familyRole: "Mom",
      password: "hashedPassword123", // In production, this should be properly hashed
      profileImage: "default.jpg"
    });
    console.log('Created Mom user:', momUser._id);

    // 2. Add Mom to workspace
    const workspaceId = "67818e488a0a9d7c443fc89d";
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get your user ID (assuming you're the first member)
    const yourUserId = workspace.members[0].userId;

    // Add to workspace members
    workspace.members.push({
      userId: momUser._id,
      role: 'member',
      joinedAt: new Date()
    });
    await workspace.save();

    // 3. Update Mom's user record with workspace
    await User.findByIdAndUpdate(momUser._id, {
      $push: {
        workspaces: {
          workspaceId: workspaceId,
          role: 'member',
          joinedAt: new Date(),
          invitedBy: yourUserId,
          relationshipToInviter: 'mother'
        }
      }
    });

    // 4. Create family relationships
    // Create mother-child relationship
    await FamilyRelationship.create({
      workspaceId: workspaceId,
      fromUserId: momUser._id,
      toUserId: yourUserId,
      relationType: 'mother'
    });

    // Create child-mother relationship
    await FamilyRelationship.create({
      workspaceId: workspaceId,
      fromUserId: yourUserId,
      toUserId: momUser._id,
      relationType: 'son' // or 'daughter' depending on the user
    });

    console.log('Successfully added Mom to workspace and created family relationships');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addMomToWorkspace(); 