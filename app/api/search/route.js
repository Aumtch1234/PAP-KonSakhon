'use server';
import pool from '../../config/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return new Response(JSON.stringify({ users: [], posts: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!pool) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    // Use parameterized queries to avoid injection
    const likeQ = `%${q}%`;

    const usersPromise = pool.query(
      'SELECT id, name, email, profile_image FROM users WHERE name ILIKE $1 ORDER BY id ASC LIMIT 20',
      [likeQ]
    );

    const postsPromise = pool.query(
      `SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, 
              u.name as user_name, u.profile_image as user_profile_image
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       WHERE p.content ILIKE $1 
       ORDER BY p.created_at DESC LIMIT 20`,
      [likeQ]
    );

    const [usersResult, postsResult] = await Promise.all([usersPromise, postsPromise]);

    const users = usersResult?.rows || [];
    const posts = postsResult?.rows || [];

    return new Response(JSON.stringify({ users, posts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
