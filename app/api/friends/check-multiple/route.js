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

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Response.json(
        { success: false, error: 'userIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const placeholders = userIds.map((_, i) => `$${i + 2}`).join(',');
    
    const result = await pool.query(
      `SELECT 
        CASE 
          WHEN sender_id = $1 THEN recipient_id
          ELSE sender_id
        END AS friend_id,
        CASE 
          WHEN (sender_id = $1 AND recipient_id = ANY(${'$' + (userIds.length + 2)}::int[]))
          OR (sender_id = ANY(${'$' + (userIds.length + 2)}::int[]) AND recipient_id = $1)
          THEN CASE
            WHEN status = 'accepted' THEN 'friends'
            WHEN sender_id = $1 THEN 'pending'
            ELSE 'waiting'
          END
          ELSE 'none'
        END AS status
      FROM friend_requests
      WHERE (sender_id = $1 OR recipient_id = $1)
      AND (sender_id = ANY(${'$' + (userIds.length + 2)}::int[]) OR recipient_id = ANY(${'$' + (userIds.length + 2)}::int[]))`,
      [currentUserId, userIds]
    );

    const statusMap = {};
    result.rows.forEach(row => {
      statusMap[row.friend_id] = row.status;
    });

    // เติมสถานะ 'none' สำหรับคนที่ไม่มีบันทึก
    userIds.forEach(id => {
      if (!statusMap[id]) {
        statusMap[id] = 'none';
      }
    });

    return Response.json({
      success: true,
      statuses: statusMap
    });
  } catch (error) {
    console.error('Error checking multiple friend statuses:', error);
    return Response.json(
      { success: false, error: 'Failed to check friend statuses' },
      { status: 500 }
    );
  }
}