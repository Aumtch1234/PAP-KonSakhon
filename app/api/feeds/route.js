import jwt from 'jsonwebtoken';
import pool from '../../config/db';

// ✅ ตรวจสอบ token
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
      const query = `
        SELECT 
          p.id,
          p.content,
          p.image_url,
          p.created_at,
          p.user_id,
          u.name AS user_name,
          u.email AS user_email,
          u.profile_image,
          COALESCE(like_count.count, 0) AS like_count,
          COALESCE(comment_count.count, 0) AS comment_count,
          CASE WHEN user_likes.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) AS count 
          FROM post_likes 
          GROUP BY post_id
        ) AS like_count ON p.id = like_count.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) AS count 
          FROM post_comments 
          GROUP BY post_id
        ) AS comment_count ON p.id = comment_count.post_id
        LEFT JOIN post_likes AS user_likes 
          ON p.id = user_likes.post_id 
         AND user_likes.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 50;
      `;

      const result = await client.query(query, [decoded.userId]);

      return Response.json(result.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Feeds API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
