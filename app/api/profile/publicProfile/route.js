// File: app/api/profile/publicProfile/route.js

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import jwt from 'jsonwebtoken';
import pool from '../../../config/db';

const JWT_SECRET = process.env.JWT_SECRET || '6540201131';

function verifyOptionalToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get('userId'));

    if (!userId || isNaN(userId)) {
      return Response.json({ success: false, error: 'กรุณาระบุ userId ที่ถูกต้อง' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // 1. ดึงข้อมูลผู้ใช้ (เฉพาะสถานะ active)
      const userQuery = `
        SELECT id, name, email, profile_image, created_at, status
        FROM users
        WHERE id = $1 AND status = 'active'
      `;
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rowCount === 0) {
        return Response.json({ success: false, error: 'ไม่พบผู้ใช้หรือผู้ใช้ไม่ได้ใช้งาน' }, { status: 404 });
      }
      const user = userResult.rows[0];

      // 2. ดึงสถิติรวม (จำนวนโพสต์, ไลค์ที่ได้รับ, คอมเมนต์ที่ได้รับ)
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*)::int FROM posts WHERE user_id = $1) AS total_posts,
          (SELECT COUNT(*)::int FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.user_id = $1) AS total_likes_received,
          (SELECT COUNT(*)::int FROM post_comments pc JOIN posts p ON pc.post_id = p.id WHERE p.user_id = $1) AS total_comments_received
      `;
      const statsResult = await client.query(statsQuery, [userId]);
      const stats = statsResult.rows[0];

      // ---- ส่วนของการดึงโพสต์ถูกนำออกไปก่อนเพื่อทดสอบ ----

      // ส่งข้อมูลกลับโดยมี posts เป็น array ว่าง
      return Response.json({
        success: true,
        user: {
          ...user,
          ...stats
        },
        posts: [], // ส่ง array ว่างกลับไปก่อน
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching simplified public profile:', error);
    return Response.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' }, { status: 500 });
  }
}

