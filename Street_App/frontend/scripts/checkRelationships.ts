import mongoose from 'mongoose';
import FamilyRelationship from '../app/api/models/FamilyRelationship';
import User from '../app/api/models/User';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

async function checkRelationships() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const workspaceId = "67818e488a0a9d7c443fc89d";
    
    // Find all relationships in the workspace
    const relationships = await FamilyRelationship.find({ 
      workspaceId,
      isActive: true 
    });

    console.log('\nActive relationships in workspace:');
    for (const rel of relationships) {
      const fromUser = await User.findById(rel.fromUserId);
      const toUser = await User.findById(rel.toUserId);
      console.log(`${fromUser?.name} is ${rel.relationType} of ${toUser?.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
checkRelationships(); 