import pool from '../../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password, profile_image, name FROM users WHERE email = $1',
        [email]
      );

      if (result.rowCount === 0) {
        return Response.json({ error: 'ไม่พบบัญชีผู้ใช้งาน' }, { status: 401 });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return Response.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, profile_image: user.profile_image, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // ✅ อัปเดต status = 'active' และ last_login เมื่อ login สำเร็จ
      await client.query(
        'UPDATE users SET last_login = NOW(), status = $1 WHERE id = $2',
        ['active', user.id]
      );

      return Response.json({
        message: 'เข้าสู่ระบบสำเร็จ',
        token,
        user: {
          id: user.id,
          email: user.email,
          profile_image: user.profile_image,
          name: user.name,
        },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}