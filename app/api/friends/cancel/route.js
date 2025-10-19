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

    // ยกเลิกคำขอที่รอการตอบรับ
    const result = await pool.query(
      `DELETE FROM friend_requests 
       WHERE sender_id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [currentUserId, friendId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Pending friend request not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      status: 'none',
      message: 'Friend request cancelled'
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    return Response.json(
      { success: false, error: 'Failed to cancel friend request' },
      { status: 500 }
    );
  }
}
