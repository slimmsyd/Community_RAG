import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import User from '@/models/User';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { relatedUserId, relationship } = await request.json();
    const userId = params.id;

    console.log('Creating relationship:', {
      userId,
      relatedUserId,
      relationship
    });

    // Get both users
    const [currentUser, relatedUser] = await Promise.all([
      User.findById(userId),
      User.findById(relatedUserId)
    ]);

    if (!currentUser || !relatedUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'One or both users not found' 
      }, { status: 404 });
    }

    // Initialize familyConnections arrays if they don't exist
    if (!currentUser.familyConnections) currentUser.familyConnections = currentUser.get('familyConnections', Array);
    if (!relatedUser.familyConnections) relatedUser.familyConnections = relatedUser.get('familyConnections', Array);

    // Get inverse relationship
    const inverseMap: { [key: string]: string } = {
      'parent': 'child',
      'child': 'parent',
      'sibling': 'sibling',
      'spouse': 'spouse',
      'grandparent': 'grandchild',
      'grandchild': 'grandparent',
      'aunt-uncle': 'niece-nephew',
      'niece-nephew': 'aunt-uncle',
      'cousin': 'cousin'
    };
    const inverseRelationship = inverseMap[relationship] || relationship;

    // Add relationship to current user
    currentUser.familyConnections.push({
      relatedUserId: relatedUser._id,
      relationship,
      confirmed: false
    });

    // Add inverse relationship to related user
    relatedUser.familyConnections.push({
      relatedUserId: currentUser._id,
      relationship: inverseRelationship,
      confirmed: false
    });

    // Save both users
    await Promise.all([
      currentUser.save(),
      relatedUser.save()
    ]);

    console.log('Relationship saved:', {
      currentUser: {
        id: currentUser._id,
        familyConnections: currentUser.familyConnections
      },
      relatedUser: {
        id: relatedUser._id,
        familyConnections: relatedUser.familyConnections
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Family relationship established successfully',
      currentUserConnections: currentUser.familyConnections,
      relatedUserConnections: relatedUser.familyConnections
    });

  } catch (error) {
    console.error('Error establishing family relationship:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to establish family relationship' 
    }, { status: 500 });
  }
}

// Get all family relationships for a user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await User.findById(params.id)
      .populate({
        path: 'familyConnections.relatedUserId',
        model: 'User',
        select: 'name email profileImage'
      });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      relationships: user.familyConnections 
    });

  } catch (error) {
    console.error('Error fetching family relationships:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch family relationships' }, { status: 500 });
  }
} 