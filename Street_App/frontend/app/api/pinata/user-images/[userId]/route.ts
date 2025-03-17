import { NextResponse } from 'next/server';

interface PinataMetadata {
  name?: string;
  keyvalues?: {
    userId?: string;
    type?: string;
    originalName?: string;
    timestamp?: string;
  };
}

interface PinataRow {
  ipfs_pin_hash: string;
  size: number;
  date_pinned: string;
  metadata: PinataMetadata;
}

interface UserImage {
  cid: string;
  name: string;
  url: string;
  timestamp: string;
  size: number;
  metadata: PinataMetadata;
  authenticatedUrl?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const pinataJWT = process.env.PINATAJWT;
    if (!pinataJWT) {
      throw new Error('Pinata JWT is not configured');
    }

    // First, get the list of files from Pinata
    const response = await fetch(
      'https://api.pinata.cloud/data/pinList',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
        }
      }
    );

    const data = await response.json();

    if (!data.rows) {
      throw new Error('Failed to fetch user images from Pinata');
    }

    // Filter images for this user and transform the data
    const userImages: UserImage[] = data.rows
      .filter((pin: PinataRow) => {
        const metadata = pin.metadata?.keyvalues;
        return metadata?.userId === params.userId;
      })
      .map((pin: PinataRow) => ({
        cid: pin.ipfs_pin_hash,
        name: pin.metadata?.name || 'Untitled',
        url: `https://teal-artistic-bonobo-612.mypinata.cloud/ipfs/${pin.ipfs_pin_hash}`,
        timestamp: pin.date_pinned,
        size: pin.size,
        metadata: pin.metadata
      }));

    // For each image, get its content using the Pinata SDK
    const imagesWithContent = await Promise.all(
      userImages.map(async (image: UserImage) => {
        try {
          // Get the authenticated URL for each image
          const signResponse = await fetch(
            'https://api.pinata.cloud/v3/files/sign',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pinataJWT}`,
              },
              body: JSON.stringify({
                url: image.url,
                expires: 3600, // 1 hour expiration
                date: Math.floor(Date.now() / 1000),
                method: "GET"
              })
            }
          );

          const signData = await signResponse.json();
          
          return {
            ...image,
            authenticatedUrl: signData.url
          };
        } catch (error) {
          console.error(`Failed to get content for image ${image.cid}:`, error);
          return image;
        }
      })
    );

    return NextResponse.json({
      success: true,
      images: imagesWithContent
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user images'
    }, { status: 500 });
  }
} 