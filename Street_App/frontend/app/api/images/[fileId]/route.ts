import { NextResponse } from 'next/server';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not configured');
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();

    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Get file info
    const fileInfo = await db.collection('images.files')
      .findOne({ _id: new ObjectId(params.fileId) });

    if (!fileInfo) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Download file to buffer
    const chunks: any[] = [];
    const downloadStream = bucket.openDownloadStream(new ObjectId(params.fileId));

    await new Promise((resolve, reject) => {
      downloadStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', reject)
        .on('end', resolve);
    });

    // Close the connection
    await client.close();

    // Combine chunks into a single buffer
    const buffer = Buffer.concat(chunks);

    // Create response with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileInfo.metadata.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileInfo.filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve file'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not configured');
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();

    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Delete file
    await bucket.delete(new ObjectId(params.fileId));

    // Close the connection
    await client.close();

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    }, { status: 500 });
  }
} 