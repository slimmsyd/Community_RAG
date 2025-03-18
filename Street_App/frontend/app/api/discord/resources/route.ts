import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongoose';
import Resource from '@/utils/models/Resource';
import User from '@/utils/models/User'; 

// Utility function to extract URL from Discord message
function extractUrl(content: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex);
  return matches ? matches[0] : null;
}

// Utility function to determine category based on keywords or channel
function determineCategory(content: string, channelName: string): 'AI' | 'Memes' | 'DAO' | 'Quantum' | null {
  const lowerContent = content.toLowerCase();
  const lowerChannel = channelName.toLowerCase();

  // Check channel first
  if (lowerChannel.includes('ai')) return 'AI';
  if (lowerChannel.includes('meme')) return 'Memes';
  if (lowerChannel.includes('dao')) return 'DAO';
  if (lowerChannel.includes('quantum')) return 'Quantum';

  // Then check content
  if (lowerContent.includes('ai') || lowerContent.includes('artificial intelligence')) return 'AI';
  if (lowerContent.includes('meme')) return 'Memes';
  if (lowerContent.includes('dao') || lowerContent.includes('governance')) return 'DAO';
  if (lowerContent.includes('quantum')) return 'Quantum';

  return null;
}

// POST /api/discord/resources - Create a new resource from Discord
export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const {
      messageContent,
      discordUserId,
      discordUsername,
      discordServerId,
      discordChannelId,
      discordMessageId,
      channelName,
    } = body;

    // Extract URL from message
    const url = extractUrl(messageContent);
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'No valid URL found in message' },
        { status: 400 }
      );
    }

    // Determine category
    const category = determineCategory(messageContent, channelName);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Could not determine appropriate category' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await User.findOne({ discordId: discordUserId });
    if (!user) {
      user = await User.create({
        name: discordUsername,
        discordId: discordUserId,
        // Add other necessary user fields
      });
    }

    // Create resource
    const resource = await Resource.create({
      title: `Resource shared by ${discordUsername}`, // This can be updated later
      description: messageContent,
      url,
      category,
      source: 'discord',
      metadata: {
        discordServerId,
        discordChannelId,
        discordMessageId,
        discordUserId,
        discordUsername,
        messageContent,
        commandUsed: '/saveResource',
      },
      addedBy: user._id,
      status: 'pending', // Resources from Discord start as pending
    });

    return NextResponse.json({
      success: true,
      resource: resource,
      message: 'Resource submitted for review'
    });

  } catch (error) {
    console.error('Error creating resource from Discord:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    );
  }
} 