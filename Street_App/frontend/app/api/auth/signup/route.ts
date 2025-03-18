import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import User from '@/utils/models/User';
import bcryptjs from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // Add debug logging to trace the connection
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI?.substring(0, 20) + '...' // Log partial URI for safety
    });

    await dbConnect();
    const body = await request.json();
    const { email, name, password, walletAddress } = body;
    
    // Validate that at least one authentication method is provided
    if (!email && !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either email or wallet address is required' 
      }, { status: 400 });
    }

    // Check if user already exists with either email or wallet
    let existingUser = null;
    
    if (email) {
      existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists. Please log in instead.' 
        }, { status: 400 });
      }
    }
    
    if (walletAddress) {
      existingUser = await User.findOne({ walletAddress });
      if (existingUser) {
        // If user exists with this wallet, return success for wallet auth
        return NextResponse.json({ 
          success: true, 
          user: {
            id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name,
            walletAddress: existingUser.walletAddress,
            familyRole: existingUser.familyRole
          }
        });
      }
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcryptjs.hash(password, 10);
    }

    // Create new user
    const user = await User.create({
      email: email || null,
      walletAddress: walletAddress || null,
      name: name || 'Anonymous User',
      password: hashedPassword,
      familyRole: 'pending', // This will be updated in the role selection step
    });
    
    console.log("User created:", user);

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        familyRole: user.familyRole
      }
    });
  } catch (error: any) {
    console.error('Error in signup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred during signup' 
    }, { status: 500 });
  }
} 