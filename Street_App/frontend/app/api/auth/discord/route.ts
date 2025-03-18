import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/utils/auth';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
// Remove any trailing slash from the APP_URL and ensure proper formatting
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
const DISCORD_REDIRECT_URI = `${BASE_URL}/api/auth/discord/callback`;

export async function GET() {
  try {
    console.log('Discord Auth Environment:', {
      clientId: DISCORD_CLIENT_ID,
      baseUrl: BASE_URL,
      redirectUri: DISCORD_REDIRECT_URI
    });

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Generate Discord OAuth URL with necessary scopes
    const scopes = [
      'identify',           // Basic user info
      'email',             // Email address
      'guilds',            // List of user's guilds (servers)
      'guilds.members.read', // Read guild member info
      'connections'        // Linked third-party accounts
    ].join(' ');

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
    
    console.log('Generated Discord Auth URL:', discordAuthUrl);

    return NextResponse.json({ success: true, url: discordAuthUrl });
  } catch (error) {
    console.error('Discord auth error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate Discord auth URL' }, { status: 500 });
  }
} 