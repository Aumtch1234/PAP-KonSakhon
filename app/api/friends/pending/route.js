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

    const result = await pool.query(
      `SELECT 
        fr.id,
        u.id AS sender_id,
        u.name,
        u.email,
        u.profile_image,
        fr.created_at
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.recipient_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC`,
      [currentUserId]
    );

    return Response.json({
      success: true,
      pending: result.rows,
      totalPending: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch pending requests' },
      { status: 500 }
    );
  }
}