import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { CryptoUser, User } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const session = await getServerSession(authOptions);
    
    // Validate input
    if (!body.twitterHandle || !body.specialty) {
      return NextResponse.json({ 
        success: false, 
        error: 'Twitter handle and specialty are required' 
      }, { status: 400 });
    }

    // Create new crypto user with submitter info if available
    const cryptoUser = await CryptoUser.create({
      twitterHandle: body.twitterHandle,
      specialty: body.specialty,
      submittedBy: session?.user ? {
        email: session.user.email,
        name: session.user.name
      } : null
    });

    // Award points if user is signed in
    if (session?.user?.email) {
      const user = await User.findOneAndUpdate(
        { email: session.user.email },
        { $inc: { points: 10 } },
        { new: true }
      );
      
      // Update the crypto user with the submitter's user ID
      if (user) {
        await CryptoUser.findByIdAndUpdate(cryptoUser._id, {
          'submittedBy.userId': user._id
        });
      }
    }

    return NextResponse.json({ success: true, data: cryptoUser });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Twitter handle already exists' 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create crypto user' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const cryptoUsers = await CryptoUser.find({})
      .sort({ createdAt: -1 }); // Sort by newest first

    return NextResponse.json({ success: true, data: cryptoUsers });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch crypto users' 
    }, { status: 500 });
  }
} 