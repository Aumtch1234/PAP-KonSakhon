import jwt from 'jsonwebtoken';
import pool from '../../../../config/db';

// ตรวจสอบ JWT
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token provided');
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET || '6540201131');
}

// GET - ดึงคอมเมนต์ทั้งหมดของโพสต์
export async function GET(request, { params }) {
  try {
    const decoded = verifyToken(request.headers.get('authorization'));
    const postId = params.id;

    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          c.id,
          c.content,
          c.created_at,
          c.updated_at,
          u.id AS user_id,
          u.name AS user_name,
          u.profile_image
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
      `;
      const result = await client.query(query, [postId]);
      return Response.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get comments error:', error);
    if (error.name === 'JsonWebTokenError') return Response.json({ error: 'Invalid token' }, { status: 401 });
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}

// POST - เพิ่มคอมเมนต์ใหม่
export async function POST(request, { params }) {
  try {
    const decoded = verifyToken(request.headers.get('authorization'));
    const postId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) return Response.json({ error: 'กรุณาใส่เนื้อหาคอมเมนต์' }, { status: 400 });

    const client = await pool.connect();
    try {
      // ตรวจสอบโพสต์
      const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rowCount === 0) return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });

      // เพิ่มคอมเมนต์
      const insert = await client.query(
        'INSERT INTO post_comments (user_id, post_id, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        [decoded.userId, postId, content.trim()]
      );

      const newComment = await client.query(
        `SELECT 
          c.id,
          c.content,
          c.created_at,
          c.updated_at,
          u.id AS user_id,
          u.name AS user_name,
          u.profile_image
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1`,
        [insert.rows[0].id]
      );

      return Response.json({ message: 'เพิ่มความคิดเห็นสำเร็จ', comment: newComment.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create comment error:', error);
    if (error.name === 'JsonWebTokenError') return Response.json({ error: 'Invalid token' }, { status: 401 });
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
