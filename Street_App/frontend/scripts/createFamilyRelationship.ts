import mongoose from 'mongoose';
import FamilyRelationship from '../app/api/models/FamilyRelationship';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createFamilyRelationship() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Create the relationship
    const relationship = await FamilyRelationship.create({
      workspaceId: '67818e488a0a9d7c443fc89d', // Your workspace ID
      fromUserId: '6789793cf830c1c9cb61720d',   // Shawn's user ID
      toUserId: '678077b20bc9569fd5d6566c',     // Your user ID (the child)
      relationType: 'mother',
      isActive: true
    });

    console.log('Created family relationship:', relationship);

    // Create the inverse relationship
    const inverseRelationship = await FamilyRelationship.create({
      workspaceId: '67818e488a0a9d7c443fc89d', // Your workspace ID
      fromUserId: '678077b20bc9569fd5d6566c',   // Your user ID
      toUserId: '6789793cf830c1c9cb61720d',     // Shawn's user ID
      relationType: 'daughter',
      isActive: true
    });

    console.log('Created inverse family relationship:', inverseRelationship);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createFamilyRelationship(); 