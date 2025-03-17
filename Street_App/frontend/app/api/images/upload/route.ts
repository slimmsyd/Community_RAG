import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { MongoClient, GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

// Helper function to convert Buffer to Readable Stream
function bufferToStream(buffer: Buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not configured');
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as string || 'profile';

    if (!file || !userId) {
      return NextResponse.json({
        success: false,
        error: 'File and userId are required'
      }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();

    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Create upload stream
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        userId,
        type,
        originalName: file.name,
        contentType: file.type,
        size: file.size,
        uploadDate: new Date()
      }
    });

    // Upload file
    await new Promise((resolve, reject) => {
      const readStream = bufferToStream(buffer);
      readStream
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // Get the file info
    const fileInfo = await db.collection('images.files')
      .findOne({ _id: uploadStream.id });

    // Close the connection
    await client.close();

    return NextResponse.json({
      success: true,
      fileId: uploadStream.id.toString(),
      filename: file.name,
      metadata: fileInfo?.metadata
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    }, { status: 500 });
  }
} 