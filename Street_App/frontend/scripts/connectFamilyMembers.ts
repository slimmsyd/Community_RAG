import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import User from '../app/api/models/User';
import Workspace from '../app/api/models/Workspace';
import FamilyRelationship from '../app/api/models/FamilyRelationship';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

// Use environment variable instead of hardcoded string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

async function connectFamilyMembers() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const workspaceId = "67818e488a0a9d7c443fc89d"; // Your workspace ID
    
    // First get the workspace without population
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Then get all members' details
    const members = await Promise.all(
      workspace.members.map((member: { userId: mongoose.Types.ObjectId }) => User.findById(member.userId))
    );

    // Find mom and you
    const momUser = members.find(user => user?.familyRole === 'Mom');
    const yourUser = members[0]; // Assuming you're the first member

    if (!momUser || !yourUser) {
      throw new Error('Could not find mom or your user');
    }

    console.log('Found mom:', momUser._id);
    console.log('Found you:', yourUser._id);

    // Check if relationship already exists
    const existingRelationship = await FamilyRelationship.findOne({
      workspaceId,
      $or: [
        { fromUserId: momUser._id, toUserId: yourUser._id },
        { fromUserId: yourUser._id, toUserId: momUser._id }
      ]
    });

    if (!existingRelationship) {
      // Create mother-child relationship
      await FamilyRelationship.create({
        workspaceId: workspaceId,
        fromUserId: momUser._id,
        toUserId: yourUser._id,
        relationType: 'mother'
      });

      // Create child-mother relationship
      await FamilyRelationship.create({
        workspaceId: workspaceId,
        fromUserId: yourUser._id,
        toUserId: momUser._id,
        relationType: 'son' // Change to 'daughter' if needed
      });

      console.log('Successfully created family relationships');
    } else {
      console.log('Family relationships already exist');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
connectFamilyMembers(); 