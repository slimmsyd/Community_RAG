import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongoose';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    const UserStats = mongoose.models.user_stats || mongoose.model('user_stats', new mongoose.Schema({}, { strict: false }));
    
    // Aggregate all user stats
    const aggregatedStats = await UserStats.aggregate([
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: '$total_interactions' },
          activeChannels: { $addToSet: '$interactions.channel_id' },
          firstInteraction: { $min: '$first_interaction' },
          interactions: { $push: '$interactions' }
        }
      }
    ]);

    // Process channel statistics
    const channelStats = new Map();
    aggregatedStats[0].interactions.flat().forEach((interaction: any) => {
      const channelName = interaction.channel_name || interaction.channel_id;
      channelStats.set(channelName, (channelStats.get(channelName) || 0) + 1);
    });

    return NextResponse.json({
      totalInteractions: aggregatedStats[0].totalInteractions,
      activeChannels: aggregatedStats[0].activeChannels,
      firstInteraction: aggregatedStats[0].firstInteraction,
      channelStats: Object.fromEntries(channelStats)
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 