import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import User from '../../models/User';
import crypto from 'crypto';

function generatePinataUrl(cid: string, pinataJWT: string) {
  const xMethod = 'GET';
  const xDate = Math.floor(Date.now() / 1000); // Current time in seconds
  const xExpires = 30;
  const xAlgorithm = 'PINATA1';

  // Create the string to sign (in exact order)
  const stringToSign = `${xMethod}\n${cid}\n${xDate}\n${xExpires}`;

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', pinataJWT)
    .update(stringToSign)
    .digest('hex');

  // Construct the full authenticated URL
  return `https://teal-artistic-bonobo-612.mypinata.cloud/files/${cid}?X-Algorithm=${xAlgorithm}&X-Date=${xDate}&X-Expires=${xExpires}&X-Method=${xMethod}&X-Signature=${signature}`;
}

export async function POST(request: Request) {
  try {
    console.log('Starting file upload process...');

    const pinataJWT = process.env.PINATAJWT;
    if (!pinataJWT) {
      console.error('Pinata JWT is missing from environment variables');
      return NextResponse.json({
        success: false,
        error: 'Pinata JWT is not configured'
      }, { status: 500 });
    }

    console.log('Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log('Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId
    });

    if (!file) {
      console.error('No file found in form data');
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Create a new FormData instance for Pinata
    console.log('Preparing Pinata upload...');
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    // Add metadata
    const metadata = {
      name: file.name,
      keyvalues: {
        userId: userId.toString(),
        type: "profile-image",
        originalName: file.name,
        timestamp: Date.now().toString()
      }
    };
    
    console.log('Adding metadata:', metadata);
    pinataFormData.append('pinataMetadata', JSON.stringify(metadata));

    // Upload to Pinata
    const pinataResponse = await fetch('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: pinataFormData,
    });

    console.log('Pinata response status:', pinataResponse.status);
    const pinataData = await pinataResponse.json();
    console.log('Pinata response data:', pinataData);

    if (!pinataData.data?.cid) {
      console.error('Failed to get CID from Pinata response:', pinataData);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload to IPFS',
        details: pinataData
      }, { status: 500 });
    }

    // Generate authenticated URL
    const authenticatedUrl = generatePinataUrl(pinataData.data.cid, pinataJWT);
    console.log('Generated authenticated URL for CID:', pinataData.data.cid);

    // Store the base URL (without auth params) in the database
    const baseUrl = `https://teal-artistic-bonobo-612.mypinata.cloud/files/${pinataData.data.cid}`;
    console.log('Storing base Pinata gateway URL:', baseUrl);
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: {
          profileImage: baseUrl,
          profileImageCID: pinataData.data.cid
        }
      },
      { new: true }
    );

    if (!user) {
      console.error('User not found with ID:', userId);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    console.log('Successfully updated user profile with new image');
    return NextResponse.json({
      success: true,
      profileImage: baseUrl,
      authenticatedUrl: authenticatedUrl
    });

  } catch (error) {
    console.error('Error in upload process:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 