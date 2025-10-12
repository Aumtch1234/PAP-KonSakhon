import jwt from 'jsonwebtoken';
import pool from '../../../config/db';
import { unlink } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || '6540201131';

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token provided');
  const token = authHeader.substring(7);
  return jwt.verify(token, JWT_SECRET);
}

// GET - ดึงโพสต์เดี่ยว
export async function GET(request, { params }) {
  try {
    const { id: postId } = await params;
    const client = await pool.connect();

    try {
      const query = `
        SELECT 
          p.id,
          p.content,
          p.image_url,
          p.created_at,
          p.updated_at,
          u.id AS user_id,
          u.name AS user_name,
          u.profile_image,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS like_count,
          (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) AS comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;
      const result = await client.query(query, [postId]);
      
      if (result.rowCount === 0) {
        return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });
      }

      return Response.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get post error:', error);
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}

// PUT - แก้ไขโพสต์
export async function PUT(request, { params }) {
  try {
    const decoded = verifyToken(request.headers.get('authorization'));
    const { id: postId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return Response.json({ error: 'กรุณาใส่เนื้อหา' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const postCheck = await client.query('SELECT id, user_id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rowCount === 0) return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });

      const post = postCheck.rows[0];
      if (post.user_id !== decoded.userId) {
        return Response.json({ error: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' }, { status: 403 });
      }

      await client.query(
        'UPDATE posts SET content = $1, updated_at = NOW() WHERE id = $2',
        [content.trim(), postId]
      );

      return Response.json({ message: 'แก้ไขโพสต์สำเร็จ' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update post error:', error);
    if (error.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}

// DELETE - ลบโพสต์
export async function DELETE(request, { params }) {
  try {
    const decoded = verifyToken(request.headers.get('authorization'));
    const { id: postId } = await params;
    const client = await pool.connect();

    try {
      const postCheck = await client.query('SELECT id, user_id, image_url FROM posts WHERE id = $1', [postId]);
      if (postCheck.rowCount === 0) return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });

      const post = postCheck.rows[0];
      if (post.user_id !== decoded.userId) {
        return Response.json({ error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' }, { status: 403 });
      }

      // ลบไฟล์ภาพถ้ามี
      if (post.image_url) {
        try {
          await unlink(path.join(process.cwd(), 'public', post.image_url));
        } catch (e) {
          console.error('Delete image error:', e);
        }
      }

      await client.query('DELETE FROM posts WHERE id = $1', [postId]);
      return Response.json({ message: 'ลบโพสต์สำเร็จ' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete post error:', error);
    if (error.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}