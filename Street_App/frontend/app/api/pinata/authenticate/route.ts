import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json({
        success: false,
        error: 'CID is required'
      }, { status: 400 });
    }

    const pinataJWT = process.env.PINATAJWT;
    if (!pinataJWT) {
      throw new Error('Pinata JWT is not configured');
    }

    // Use Pinata's signing endpoint
    const payload = JSON.stringify({
      url: `https://teal-artistic-bonobo-612.mypinata.cloud/ipfs/${cid}`,
      expires: 300, // 5 minutes expiration
      date: Math.floor(Date.now() / 1000),
      method: "GET"
    });

    const signResponse = await fetch(
      'https://api.pinata.cloud/v3/files/sign',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataJWT}`,
        },
        body: payload
      }
    );

    const response = await signResponse.json();

    if (!response.url) {
      throw new Error('Failed to get signed URL from Pinata');
    }

    return NextResponse.json({
      success: true,
      url: response.url
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate authenticated URL'
    }, { status: 500 });
  }
} 