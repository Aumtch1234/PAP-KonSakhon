// File: app/api/users/[userId]/posts/route.js

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import jwt from 'jsonwebtoken';
import pool from '../../../../config/db';

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

export async function GET(request, { params }) {
  try {
    const profileUserId = Number(params.userId);

    if (!profileUserId || isNaN(profileUserId)) {
      return Response.json({ success: false, error: 'กรุณาระบุ userId ที่ถูกต้อง' }, { status: 400 });
    }

    const decoded = verifyOptionalToken(request);
    const currentViewerId = decoded?.userId ?? null;

    const client = await pool.connect();
    try {
      // ✅ ปรับปรุง SQL Query ใหม่ทั้งหมดเพื่อแก้ปัญหา Parameter
      const postsQuery = `
        SELECT 
          p.id,
          p.content,
          p.image_url,
          p.created_at,
          p.user_id,
          u.name AS user_name,
          u.profile_image AS user_profile_image,
          (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) AS likes_count,
          (SELECT COUNT(*)::int FROM post_comments WHERE post_id = p.id) AS comments_count,
          -- ใช้ LEFT JOIN และตรวจสอบว่า pl.id ไม่ใช่ NULL เพื่อเช็คสถานะการไลค์
          (pl.id IS NOT NULL) AS is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        -- ใช้ LEFT JOIN กับ post_likes โดยตรง
        LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = $2
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
      `;
      
      const postsResult = await client.query(postsQuery, [profileUserId, currentViewerId]);

      return Response.json({
        success: true,
        posts: postsResult.rows,
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return Response.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' }, { status: 500 });
  }
}

