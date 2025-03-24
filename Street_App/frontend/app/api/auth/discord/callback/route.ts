export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/utils/auth';
import dbConnect from '@/utils/dbConnect';
import { User } from '@/models';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
const DISCORD_REDIRECT_URI = `${BASE_URL}/api/auth/discord/callback`;

export async function GET(request: Request) {
  try {
    console.log('Discord Callback Environment:', {
      clientId: DISCORD_CLIENT_ID,
      baseUrl: BASE_URL,
      redirectUri: DISCORD_REDIRECT_URI
    });

    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('No session found in callback');
      return NextResponse.redirect(`${BASE_URL}/app/settings?discord=error&reason=no_session`);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('Discord OAuth error:', error, errorDescription);
      return NextResponse.redirect(`${BASE_URL}/app/settings?discord=error&reason=${error}`);
    }

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(`${BASE_URL}/app/settings?discord=error&reason=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(`${BASE_URL}/app/settings?discord=error&reason=token_exchange_failed`);
    }

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!userResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to get Discord user info' }, { status: 400 });
    }

    // Get user's guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const guilds = await guildsResponse.json();

    // Get user's connections
    const connectionsResponse = await fetch('https://discord.com/api/users/@me/connections', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const connections = await connectionsResponse.json();

    // Update user in database
    await dbConnect();
    
    // Find user by email or wallet address
    const user = await User.findOne({
      $or: [
        { email: session.user.email },
        { walletAddress: session.user.walletAddress }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update user's Discord info with expanded data
    user.discordId = discordUser.id;
    user.discordTag = `${discordUser.username}${discordUser.discriminator ? `#${discordUser.discriminator}` : ''}`;
    user.discordEmail = discordUser.email;
    user.discordGuilds = guilds.map((guild: any) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: guild.owner,
      permissions: guild.permissions
    }));
    user.discordConnections = connections;
    user.discordAvatarUrl = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` 
      : null;

    await user.save();

    // Redirect back to settings page with success
    return NextResponse.redirect(`${BASE_URL}/app/settings?discord=success`);

  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(`${BASE_URL}/app/settings?discord=error&reason=server_error`);
  }
} 