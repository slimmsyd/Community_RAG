import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    
    const UserStats = mongoose.models.user_stats || mongoose.model('user_stats', new mongoose.Schema({}, { strict: false }));
    
    // Aggregate pipeline to process all user interactions
    const pipeline = [
      // Unwind the interactions array
      { $unwind: "$interactions" },
      
      // Group by channel
      {
        $group: {
          _id: {
            channel_id: "$interactions.channel_id",
            channel_name: "$interactions.channel_name"
          },
          total_interactions: { $sum: 1 },
          unique_users: { $addToSet: "$user_id" }
        }
      },

      // Format the output
      {
        $project: {
          _id: 0,
          channel_id: "$_id.channel_id",
          name: { 
            $ifNull: ["$_id.channel_name", "Unknown Channel"]
          },
          total_interactions: 1,
          unique_users: { $size: "$unique_users" }
        }
      },

      // Sort by total interactions
      { $sort: { total_interactions: -1 } }
    ];

    const channelStats = await UserStats.aggregate(pipeline as any);

    // Calculate total interactions
    const totalInteractions = channelStats.reduce(
      (sum, channel) => sum + channel.total_interactions, 
      0
    );

    // Format and clean channel names, calculate percentages
    const formattedStats = channelStats.map(channel => ({
      ...channel,
      name: channel.name?.replace(/[📚🛠️📝-]/g, '').trim() || 'Unknown Channel',
      percentage: ((channel.total_interactions / totalInteractions) * 100).toFixed(1)
    }));

    // console.log('Global Channel Stats:', {
    //   total_interactions: totalInteractions,
    //   channels: formattedStats
    // });

    return NextResponse.json({
      total_interactions: totalInteractions,
      channels: formattedStats
    });

  } catch (error) {
    console.error('Error in global channel stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global channel stats' },
      { status: 500 }
    );
  }
} 