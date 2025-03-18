import { NextResponse } from 'next/server';

import Resource from '@/app/api/models/Resource';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/lib/authOptions';
import { connectToDatabase } from '@/utils/mongoose';
import mongoose from 'mongoose';

// GET /api/resources - Get all resources
export async function GET() {
  try {
    await connectToDatabase();
    
    // Debug: List all databases and collections
    const adminDb = mongoose.connection.db?.admin();
    const databases = await adminDb?.listDatabases();
    
    console.log('All Databases:');
    databases?.databases?.forEach(db => {
      console.log(`- ${db.name}`);
    });

    console.log('Collections in current database:');
      const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log(collections?.map(c => c.name));

    const resources = await Resource.find({}).sort({ timestamp: -1 });
    console.log("Found resources:", resources.length);

    // Get unique tags from all resources
    const allTags = resources.reduce((tags: string[], resource) => {
      if (resource.tags && Array.isArray(resource.tags)) {
        return [...tags, ...resource.tags];
      }
      return tags;
    }, []);
    const uniqueTags = Array.from(new Set(allTags));

    console.log("Logging the unique tags");
    console.log(uniqueTags);
    console.log("resources", resources);
    
    return NextResponse.json({
      success: true,
      resources: resources,
      categories: uniqueTags,
    });
  } catch (error) {
    console.error('Error:', error);
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create a new resource
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { link, tags } = body;

    await connectToDatabase();

    const resource = await Resource.create({
      link,
      tags,
      submitted_by: {
        user_id: session.user.id,
        username: session.user.name
      },
      upvotes: 0,
      auto_tagged: true // Set based on your tagging logic
    });

    return NextResponse.json({
      success: true,
      resource: resource,
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    );
  }
} 