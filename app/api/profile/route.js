import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import pool from '../../config/db';

const JWT_SECRET = process.env.JWT_SECRET || '6540201131';

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token provided');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
}

export async function PUT(request) {
  try {
    const decoded = verifyToken(request.headers.get('Authorization'));
    const userId = decoded.userId;

    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const profileImage = formData.get('profileImage');

    if (!name || !email) {
      return Response.json({ error: 'กรุณากรอกชื่อและอีเมล' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // ดึงข้อมูลผู้ใช้ปัจจุบัน
      const resUser = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (resUser.rows.length === 0) return Response.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });

      const currentUser = resUser.rows[0];

      // ตรวจสอบอีเมลซ้ำ
      if (email !== currentUser.email) {
        const resEmail = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (resEmail.rows.length > 0) return Response.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 });
      }

      // ตรวจสอบรหัสผ่านปัจจุบันถ้ามีการเปลี่ยนรหัสผ่าน
      if (newPassword) {
        if (!currentPassword) return Response.json({ error: 'กรุณาใส่รหัสผ่านปัจจุบัน' }, { status: 400 });
        const isValid = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isValid) return Response.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
      }

      // อัปโหลดภาพถ้ามี
      let profileImageUrl = null;
      if (profileImage && profileImage.size > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        await mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const ext = profileImage.name.split('.').pop();
        const fileName = `profile_${userId}_${timestamp}.${ext}`;
        const filePath = path.join(uploadDir, fileName);
        const buffer = Buffer.from(await profileImage.arrayBuffer());
        await writeFile(filePath, buffer);

        profileImageUrl = `/uploads/profiles/${fileName}`;

        // ลบรูปเก่าถ้ามี
        if (currentUser.profile_image) {
          try { await unlink(path.join(process.cwd(), 'public', currentUser.profile_image)); } catch {}
        }
      }

      // เตรียม SQL Update
      let updateQuery = 'UPDATE users SET name=$1, email=$2, updated_at=NOW()';
      const updateParams = [name, email];

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        updateQuery += ', password=$3';
        updateParams.push(hashedPassword);
      }

      if (profileImageUrl) {
        updateQuery += newPassword ? ', profile_image=$4' : ', profile_image=$3';
        updateParams.push(profileImageUrl);
      }

      updateQuery += ' WHERE id=$' + (updateParams.length + 1);
      updateParams.push(userId);

      await client.query(updateQuery, updateParams);

      // ดึงข้อมูลผู้ใช้ที่อัปเดตแล้ว
      const resUpdated = await client.query(
        'SELECT id, name, email, profile_image, created_at FROM users WHERE id = $1',
        [userId]
      );

      return Response.json({ message: 'อัปเดตโปรไฟล์สำเร็จ', user: resUpdated.rows[0] });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
