import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '../../config/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const profileImage = formData.get('profileImage');

    if (!name || !email || !password) return Response.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    if (password.length < 6) return Response.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    if (password !== confirmPassword) return Response.json({ error: 'รหัสผ่านไม่ตรงกัน' }, { status: 400 });

    // อัปโหลดรูปถ้ามี
    let profileImageUrl = null;
    if (profileImage && profileImage.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const ext = profileImage.name.split('.').pop();
      const fileName = `profile_${timestamp}.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await profileImage.arrayBuffer());
      await writeFile(filePath, buffer);

      profileImageUrl = `/uploads/profiles/${fileName}`;
    }

    const client = await pool.connect();
    try {
      // ตรวจสอบอีเมลซ้ำ
      const resEmail = await client.query('SELECT id FROM users WHERE email=$1', [email]);
      if (resEmail.rows.length > 0) return Response.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 });

      const hashedPassword = await bcrypt.hash(password, 12);

      const resInsert = await client.query(
        'INSERT INTO users (name, email, password, profile_image, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING id',
        [name, email, hashedPassword, profileImageUrl]
      );

      return Response.json({ message: 'สร้างบัญชีสำเร็จ กรุณาเข้าสู่ระบบ', userId: resInsert.rows[0].id });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
