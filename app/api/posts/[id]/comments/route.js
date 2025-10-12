import jwt from 'jsonwebtoken';
import pool from '../../../../config/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    // ✅ await params ก่อน
    const { id: postId } = await params;

    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          c.id,
          c.content,
          c.image_url,
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
    // ✅ await params ก่อน
    const { id: postId } = await params;
    
    // ตรวจสอบ Content-Type เพื่อดูว่าเป็น FormData หรือ JSON
    const contentType = request.headers.get('content-type');
    let content, imageFile;
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // รับข้อมูลจาก FormData
      const formData = await request.formData();
      content = formData.get('content');
      imageFile = formData.get('image');
    } else {
      // รับข้อมูลจาก JSON (เก่า)
      const body = await request.json();
      content = body.content;
    }

    if (!content?.trim() && !imageFile) {
      return Response.json({ error: 'กรุณาใส่เนื้อหาคอมเมนต์หรือแนบรูปภาพ' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // ตรวจสอบโพสต์
      const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rowCount === 0) return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });

      let imageUrl = null;
      
      // จัดการอัปโหลดรูปภาพ
      if (imageFile && imageFile.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
          return Response.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)' }, { status: 400 });
        }

        if (imageFile.size > 5 * 1024 * 1024) { // 5MB
          return Response.json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' }, { status: 400 });
        }

        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // สร้างชื่อไฟล์ใหม่
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(imageFile.name) || '.jpg';
        const fileName = `comment_${timestamp}_${randomString}${extension}`;
        
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comments');
        await mkdir(uploadDir, { recursive: true });
        
        // บันทึกไฟล์
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        
        imageUrl = `/uploads/comments/${fileName}`;
      }

      // เพิ่มคอมเมนต์
      const insert = await client.query(
        'INSERT INTO post_comments (user_id, post_id, content, image_url, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
        [decoded.userId, postId, content?.trim() || '', imageUrl]
      );

      const newComment = await client.query(
        `SELECT 
          c.id,
          c.content,
          c.image_url,
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