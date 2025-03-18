import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/utils/mongoose';
import mongoose from 'mongoose';

// Define the UserStats schema
const UserStatsSchema = new mongoose.Schema({
  user_id: String,
  username: String,
  total_interactions: Number,
  last_active: Date,
  avatar: String
});

// Create the model (only if it doesn't exist)
const UserStats = mongoose.models.user_stats || mongoose.model('user_stats', UserStatsSchema);

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const members = await UserStats.find({})
      .sort({ total_interactions: -1 }) // Sort by total interactions in descending order
      .select('user_id username total_interactions last_active avatar');

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 