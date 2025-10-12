import jwt from 'jsonwebtoken';
import pool from '../../../../config/db';

const JWT_SECRET = process.env.JWT_SECRET || '6540201131';

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token provided');
  const token = authHeader.substring(7);
  return jwt.verify(token, JWT_SECRET);
}

// POST - toggle like
export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    const postId = params.id;

    const client = await pool.connect();
    try {
      // ตรวจสอบว่าโพสต์มีอยู่
      const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });

      // ตรวจสอบว่าเคยไลค์แล้วหรือยัง
      const existingLike = await client.query('SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2', [decoded.userId, postId]);

      let isLiked;
      if (existingLike.rows.length > 0) {
        await client.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [decoded.userId, postId]);
        isLiked = false;
      } else {
        await client.query('INSERT INTO post_likes (user_id, post_id, created_at) VALUES ($1, $2, NOW())', [decoded.userId, postId]);
        isLiked = true;
      }

      // นับจำนวนไลค์ทั้งหมด
      const likeCount = await client.query('SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1', [postId]);

      return Response.json({
        message: isLiked ? 'ไลค์โพสต์แล้ว' : 'ยกเลิกไลค์แล้ว',
        isLiked,
        likeCount: parseInt(likeCount.rows[0].count)
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Like toggle error:', error);
    if (error.name === 'JsonWebTokenError') return Response.json({ error: 'Invalid token' }, { status: 401 });
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}

// GET - ดึงสถานะไลค์และจำนวน
export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    const postId = params.id;

    const client = await pool.connect();
    try {
      const userLike = await client.query('SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2', [decoded.userId, postId]);
      const likeCount = await client.query('SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1', [postId]);

      return Response.json({
        isLiked: userLike.rows.length > 0,
        likeCount: parseInt(likeCount.rows[0].count)
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get like status error:', error);
    if (error.name === 'JsonWebTokenError') return Response.json({ error: 'Invalid token' }, { status: 401 });
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
