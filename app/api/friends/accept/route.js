import jwt from 'jsonwebtoken';
import pool from "../../../config/db";

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;

    const { friendId } = await req.json();

    if (!friendId) {
      return Response.json(
        { success: false, error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    // ยอมรับคำขอ
    const result = await pool.query(
      `UPDATE friend_requests 
       SET status = 'accepted', updated_at = NOW()
       WHERE sender_id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [friendId, currentUserId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Friend request not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      status: 'friends',
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept request error:', error);
    return Response.json(
      { success: false, error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}