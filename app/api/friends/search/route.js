import pool from "../../../config/db";
import jwt from 'jsonwebtoken';

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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return Response.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.profile_image,
        CASE 
          WHEN u.id = $1 THEN 'self'
          WHEN EXISTS(
            SELECT 1 FROM friend_requests 
            WHERE (sender_id = $1 AND recipient_id = u.id 
            OR sender_id = u.id AND recipient_id = $1)
            AND status = 'accepted'
          ) THEN 'friend'
          WHEN EXISTS(
            SELECT 1 FROM friend_requests 
            WHERE sender_id = $1 AND recipient_id = u.id 
            AND status = 'pending'
          ) THEN 'pending'
          WHEN EXISTS(
            SELECT 1 FROM friend_requests 
            WHERE sender_id = u.id AND recipient_id = $1 
            AND status = 'pending'
          ) THEN 'waiting'
          ELSE 'none'
        END AS friendship_status
      FROM users u
      WHERE LOWER(u.name) LIKE LOWER($2) OR LOWER(u.email) LIKE LOWER($2)
      AND u.id != $1
      LIMIT 20`,
      [currentUserId, `%${query}%`]
    );

    return Response.json({
      success: true,
      users: result.rows,
      totalResults: result.rows.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return Response.json(
      { success: false, error: 'Failed to search users' },
      { status: 500 }
    );
  }
}