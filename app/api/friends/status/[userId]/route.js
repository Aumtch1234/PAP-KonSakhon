import jwt from 'jsonwebtoken';
import pool from "../../../../config/db";

export async function GET(req, { params }) {
  try {
    const { userId } = await params;

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

    // ถ้าเป็นโปรไฟล์ตัวเอง
    if (currentUserId === parseInt(userId)) {
      return Response.json({
        success: true,
        status: 'self',
        isFriend: false
      });
    }

    // ตรวจสอบความสัมพันธ์
    const result = await pool.query(
      `SELECT status FROM friend_requests 
       WHERE (sender_id = $1 AND recipient_id = $2) 
       OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [currentUserId, userId]
    );

    if (result.rows.length === 0) {
      return Response.json({
        success: true,
        status: 'none',
        isFriend: false
      });
    }

    const { status } = result.rows[0];

    // ถ้าเป็นเพื่อนแล้ว
    if (status === 'accepted') {
      return Response.json({
        success: true,
        status: 'friends',
        isFriend: true
      });
    }

    // ตรวจสอบว่าเป็น sender หรือ recipient
    const senderCheck = await pool.query(
      `SELECT sender_id FROM friend_requests 
       WHERE sender_id = $1 AND recipient_id = $2 AND status = 'pending'`,
      [currentUserId, userId]
    );

    const isPending = senderCheck.rows.length > 0;
    const isWaiting = !isPending && status === 'pending';

    return Response.json({
      success: true,
      status: isPending ? 'pending' : isWaiting ? 'waiting' : 'none',
      isFriend: false
    });
  } catch (error) {
    console.error('Error checking friend status:', error);
    return Response.json(
      { success: false, error: 'Failed to check friend status' },
      { status: 500 }
    );
  }
}