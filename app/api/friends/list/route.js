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
    const currentUserId = decoded.userId || decoded.id;

    // ✅ เพิ่ม last_login เพื่อตรวจสอบสถานะออนไลน์
    const result = await pool.query(
      `SELECT 
        CASE 
          WHEN fr.sender_id = $1 THEN fr.recipient_id
          ELSE fr.sender_id
        END AS friend_id,
        CASE 
          WHEN fr.sender_id = $1 THEN u2.name
          ELSE u1.name
        END AS friend_name,
        CASE 
          WHEN fr.sender_id = $1 THEN u2.email
          ELSE u1.email
        END AS friend_email,
        CASE 
          WHEN fr.sender_id = $1 THEN u2.profile_image
          ELSE u1.profile_image
        END AS friend_profile_image,
        CASE 
          WHEN fr.sender_id = $1 THEN u2.last_login
          ELSE u1.last_login
        END AS last_login,
        CASE 
          WHEN fr.sender_id = $1 THEN u2.status
          ELSE u1.status
        END AS status,
        fr.created_at AS friend_since
      FROM friend_requests fr
      JOIN users u1 ON fr.sender_id = u1.id
      JOIN users u2 ON fr.recipient_id = u2.id
      WHERE (fr.sender_id = $1 OR fr.recipient_id = $1) 
      AND fr.status = 'accepted'
      ORDER BY 
        CASE 
          WHEN fr.sender_id = $1 THEN u2.last_login
          ELSE u1.last_login
        END DESC NULLS LAST,
        fr.created_at DESC`,
      [currentUserId]
    );

    return Response.json({
      success: true,
      friends: result.rows,
      totalFriends: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch friends list' },
      { status: 500 }
    );
  }
}