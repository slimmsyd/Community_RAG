import mongoose from 'mongoose';
import FamilyRelationship from '../app/api/models/FamilyRelationship';
import User from '../app/api/models/User';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

async function testFamilyTreeAPI() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const workspaceId = "67818e488a0a9d7c443fc89d";
    
    // 1. Log all users in workspace
    const users = await User.find({
      'workspaces.workspaceId': workspaceId
    });
    
    console.log('\nUsers in workspace:');
    users.forEach(user => {
      console.log(`${user.name} (${user._id}) - Role: ${user.familyRole}`);
    });

    // 2. Log all relationships
    const relationships = await FamilyRelationship.find({ 
      workspaceId,
      isActive: true 
    });

    console.log('\nRelationships in database:');
    for (const rel of relationships) {
      console.log({
        from: rel.fromUserId.toString(),
        to: rel.toUserId.toString(),
        type: rel.relationType,
        isActive: rel.isActive
      });
    }

    // 3. Check if relationships match users
    console.log('\nVerifying relationships:');
    for (const rel of relationships) {
      const fromUser = users.find(u => u._id.toString() === rel.fromUserId.toString());
      const toUser = users.find(u => u._id.toString() === rel.toUserId.toString());
      console.log(`${fromUser?.name} (${fromUser?.familyRole}) is ${rel.relationType} of ${toUser?.name} (${toUser?.familyRole})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
testFamilyTreeAPI(); 