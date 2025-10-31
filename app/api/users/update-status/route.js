import jwt from 'jsonwebtoken';
import pool from '../../../config/db';

// ✅ API เพื่ออัปเดต status ของ user (active/inactive)
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
    const userId = decoded.userId || decoded.id;

    const { status } = await req.json();

    // ✅ ตรวจสอบ status ให้ถูกต้อง
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return Response.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // ✅ อัปเดต status
    const result = await pool.query(
      `UPDATE users 
       SET status = $1, last_login = NOW()
       WHERE id = $2
       RETURNING id, name, status, last_login`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      user: result.rows[0],
      message: `Status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return Response.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}