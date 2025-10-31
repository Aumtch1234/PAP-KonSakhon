import pool from '../../../../config/db';
import jwt from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return Response.json({ error: 'ไม่พบ token' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const chatId = params.chatId;

    const client = await pool.connect();
    try {
      // อัพเดทข้อความทั้งหมดในแชทนี้ที่ยังไม่ได้อ่าน และไม่ใช่ข้อความของตัวเอง
      const result = await client.query(
        `UPDATE messages 
         SET is_read = TRUE 
         WHERE chat_id = $1 
         AND sender_id != $2 
         AND is_read = FALSE
         RETURNING id`,
        [chatId, userId]
      );

      console.log(`✅ Marked ${result.rowCount} messages as read in chat ${chatId}`);

      return Response.json({ 
        success: true, 
        markedCount: result.rowCount,
        chatId: Number(chatId)
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error marking messages as read:', err);
    return Response.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}