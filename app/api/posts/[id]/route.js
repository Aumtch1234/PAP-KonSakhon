import { unlink } from 'fs/promises';
import path from 'path';

// DELETE post
export async function DELETE(request, { params }) {
  try {
    const decoded = verifyToken(request.headers.get('authorization'));
    const postId = params.id;
    const client = await pool.connect();

    try {
      const postCheck = await client.query('SELECT id, user_id, image_url FROM posts WHERE id = $1', [postId]);
      if (postCheck.rowCount === 0) return Response.json({ error: 'ไม่พบโพสต์' }, { status: 404 });

      const post = postCheck.rows[0];
      if (post.user_id !== decoded.userId) return Response.json({ error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' }, { status: 403 });

      // ลบไฟล์ภาพถ้ามี
      if (post.image_url) {
        try { await unlink(path.join(process.cwd(), 'public', post.image_url)); } catch(e) { console.error(e); }
      }

      await client.query('DELETE FROM posts WHERE id = $1', [postId]);
      return Response.json({ message: 'ลบโพสต์สำเร็จ' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete post error:', error);
    if (error.name === 'JsonWebTokenError') return Response.json({ error: 'Invalid token' }, { status: 401 });
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
