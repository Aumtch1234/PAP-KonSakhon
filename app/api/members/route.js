import jwt from 'jsonwebtoken';
import pool from '../../config/db';

// ✅ ตรวจสอบ JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET || '6540201131');
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);

    const client = await pool.connect();
    try {
      // ✅ ดึงข้อมูลผู้ใช้งานทั้งหมด (ยกเว้นตัวเอง ถ้าต้องการ)
      const query = `
        SELECT 
          id,
          name,
          email,
          profile_image,
          last_login,
          created_at
        FROM users
        WHERE status = 'active'
        ORDER BY last_login DESC, created_at DESC
      `;
      
      const result = await client.query(query);
      return Response.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Members API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
