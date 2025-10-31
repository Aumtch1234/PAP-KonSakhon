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

// ✅ ตรวจสอบว่าผู้ใช้ออนไลน์หรือไม่ (ล่าสุด 5 นาที)
function isUserOnline(lastLogin) {
  if (!lastLogin) return false;
  const lastLoginTime = new Date(lastLogin).getTime();
  const currentTime = new Date().getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;
  return (currentTime - lastLoginTime) < fiveMinutesInMs;
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    const userId = decoded.id || decoded.userId || decoded.sub;

    console.log('🔍 Current user ID:', userId);

    const client = await pool.connect();
    try {
      // ✅ ดึงสมาชิกทั้งหมด ยกเว้น ตัวเอง และ เพื่อนที่ accepted แล้ว
      const query = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.profile_image,
          u.last_login,
          u.status,
          u.created_at
        FROM users u
        LEFT JOIN friend_requests fr ON 
          (fr.sender_id = u.id AND fr.recipient_id = $1 AND fr.status = 'accepted')
          OR (fr.recipient_id = u.id AND fr.sender_id = $1 AND fr.status = 'accepted')
        WHERE u.id != $1
          AND fr.id IS NULL
        ORDER BY u.last_login DESC, u.created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      
      console.log('✅ Found members:', result.rows.length);
      
      // ✅ เพิ่ม online status ที่คำนวณจาก last_login
      const membersWithOnlineStatus = result.rows.map(user => ({
        ...user,
        online: isUserOnline(user.last_login)
      }));

      return Response.json({
        success: true,
        members: membersWithOnlineStatus,
        currentUserId: userId
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Members API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return Response.json({ 
        error: 'Invalid token',
        success: false 
      }, { status: 401 });
    }
    return Response.json({ 
      error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
      success: false 
    }, { status: 500 });
  }
}