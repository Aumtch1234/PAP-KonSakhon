import jwt from 'jsonwebtoken';
import pool from '../../../config/db';

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

    if (currentUserId === friendId) {
      return Response.json(
        { success: false, error: 'Cannot send request to yourself' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีคำขออยู่แล้ว
    const existing = await pool.query(
      `SELECT id, status FROM friend_requests 
       WHERE (sender_id = $1 AND recipient_id = $2) 
       OR (sender_id = $2 AND recipient_id = $1)`,
      [currentUserId, friendId]
    );

    if (existing.rows.length > 0) {
      const existingStatus = existing.rows[0].status;
      if (existingStatus === 'pending') {
        return Response.json(
          { success: false, error: 'Friend request already sent' },
          { status: 400 }
        );
      }
      if (existingStatus === 'accepted') {
        return Response.json(
          { success: false, error: 'Already friends' },
          { status: 400 }
        );
      }
    }

    // สร้างคำขอเพื่อนใหม่
    await pool.query(
      `INSERT INTO friend_requests (sender_id, recipient_id, status) 
       VALUES ($1, $2, 'pending')`,
      [currentUserId, friendId]
    );

    return Response.json({
      success: true,
      status: 'pending',
      message: 'Friend request sent'
    });
  } catch (error) {
    console.error('Send request error:', error);
    return Response.json(
      { success: false, error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}