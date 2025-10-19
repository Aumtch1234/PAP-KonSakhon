import jwt from 'jsonwebtoken';
import pool from "../../../config/db";

export async function GET(req) {
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

    const friendsResult = await pool.query(
      `SELECT COUNT(*) as count FROM friend_requests
       WHERE (sender_id = $1 OR recipient_id = $1) AND status = 'accepted'`,
      [currentUserId]
    );

    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM friend_requests
       WHERE recipient_id = $1 AND status = 'pending'`,
      [currentUserId]
    );

    return Response.json({
      success: true,
      friendsCount: parseInt(friendsResult.rows[0].count),
      pendingCount: parseInt(pendingResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error counting friends:', error);
    return Response.json(
      { success: false, error: 'Failed to count friends' },
      { status: 500 }
    );
  }
}