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

    // ลบความสัมพันธ์เพื่อน
    const result = await pool.query(
      `DELETE FROM friend_requests 
       WHERE ((sender_id = $1 AND recipient_id = $2) 
       OR (sender_id = $2 AND recipient_id = $1))
       AND status = 'accepted'
       RETURNING *`,
      [currentUserId, friendId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Friend relationship not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      status: 'none',
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    return Response.json(
      { success: false, error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}