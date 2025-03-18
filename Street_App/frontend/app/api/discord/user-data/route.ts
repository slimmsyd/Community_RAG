import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongoose';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    console.log('Fetching data for userId:', userId); // Debug log

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const UserStats = mongoose.models.user_stats || mongoose.model('user_stats', new mongoose.Schema({}, { strict: false }));
    
    // Find user by user_id (not _id)
    const userData = await UserStats.findOne({ user_id: userId });
    
    console.log('Found user data:', userData); // Debug log

    if (!userData) {
      console.log('No user found for userId:', userId); // Debug log
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 