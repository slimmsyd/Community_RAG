import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not configured');
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB HERE');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    const db = client.db();

    // Find all files for this user
    const files = await db.collection('images.files')
      .find({
        'metadata.userId': params.userId
      })
      .sort({ uploadDate: -1 })
      .toArray();

    // Close the connection
    await client.close();

    // Transform the data
    const images = files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.metadata.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/images/${file._id.toString()}`
    }));

    return NextResponse.json({
      success: true,
      images
    });

  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files'
    }, { status: 500 });
  }
} 