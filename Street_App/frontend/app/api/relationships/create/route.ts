import { NextResponse } from 'next/server';
import { RelationshipService } from '@/lib/arweave/relationshipService';
import dbConnect from '@/lib/dbConnect';
import User from '@/app/api/models/User';

export async function POST(req: Request) {
  try {
    const { fromUserId, toUserId, relationType, metadata } = await req.json();

    // Validate input
    if (!fromUserId || !toUserId || !relationType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();

    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId)
    ]);

    if (!fromUser || !toUser) {
      return NextResponse.json(
        { success: false, error: 'One or both users not found' },
        { status: 404 }
      );
    }

    // Create relationship data for Arweave
    const relationshipData = {
      fromUserId,
      toUserId,
      relationType,
      timestamp: Date.now(),
      metadata: {
        fromUserName: fromUser.name,
        toUserName: toUser.name,
        createdBy: fromUserId,
        ...metadata
      }
    };

    // Store relationship on Arweave
    const arweaveResult = await RelationshipService.createRelationship(relationshipData);

    if (arweaveResult.status === 'error') {
      return NextResponse.json(
        { success: false, error: arweaveResult.message },
        { status: 500 }
      );
    }

    // Update MongoDB with relationship and Arweave transaction ID
    const relationshipUpdate = {
      relatedUserId: toUserId,
      relationship: relationType,
      confirmed: false,
      arweaveTransactionId: arweaveResult.transactionId
    };

    // Add relationship to both users
    await Promise.all([
      User.findByIdAndUpdate(fromUserId, {
        $push: { familyConnections: relationshipUpdate }
      }),
      User.findByIdAndUpdate(toUserId, {
        $push: {
          familyConnections: {
            ...relationshipUpdate,
            relatedUserId: fromUserId,
            confirmed: false
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        relationshipId: arweaveResult.transactionId,
        status: 'pending_confirmation'
      }
    });

  } catch (error) {
    console.error('Error creating relationship:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 