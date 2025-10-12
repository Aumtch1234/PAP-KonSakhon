import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '../../config/db';

// ตรวจสอบ JWT
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token provided');
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET || '6540201131');
}

export async function POST(request) {
  try {
    const decoded = verifyToken(request.headers.get('authorization'));

    const formData = await request.formData();
    const content = formData.get('content');
    const image = formData.get('image');

    if (!content?.trim()) {
      return Response.json({ error: 'กรุณาใส่เนื้อหาโพสต์' }, { status: 400 });
    }

    let imageUrl = null;

    // อัปโหลดรูปถ้ามี
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const extension = image.name.split('.').pop();
      const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/${filename}`;
    }

    const client = await pool.connect();
    try {
      const insertQuery = `
        INSERT INTO posts (user_id, content, image_url, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `;
      const result = await client.query(insertQuery, [decoded.userId, content.trim(), imageUrl]);

      return Response.json({
        message: 'โพสต์สำเร็จ',
        postId: result.rows[0].id
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'JsonWebTokenError') return Response.json({ error: 'Invalid token' }, { status: 401 });
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}