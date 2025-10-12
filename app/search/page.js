import pool from '../config/db';
import NavBar from '../components/NavBar/page';
import MembersSidebar from '../components/MembersSidebar/page';
import ProfileSidebar from '../components/ProfileSidebar/page';
import SearchResultsClient from '../components/SearchResultsClient/page';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || '').trim();

  if (!q) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-semibold mb-4">ผลการค้นหา</h2>
        <p className="text-gray-600">กรุณาพิมพ์คำค้นหา</p>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-semibold mb-4">ผลการค้นหา</h2>
        <p className="text-red-600">Database not configured</p>
      </div>
    );
  }

  const likeQ = `%${q}%`;

  const usersPromise = pool.query(
    'SELECT id, name, email, profile_image FROM users WHERE name ILIKE $1 ORDER BY id ASC LIMIT 100',
    [likeQ]
  );

  const postsPromise = pool.query(
    `SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, 
            u.name as user_name, u.profile_image as user_profile_image
     FROM posts p 
     LEFT JOIN users u ON p.user_id = u.id 
     WHERE p.content ILIKE $1 
     ORDER BY p.created_at DESC LIMIT 100`,
    [likeQ]
  );

  const [usersRes, postsRes] = await Promise.all([usersPromise, postsPromise]);

  const users = usersRes?.rows || [];
  const posts = postsRes?.rows || [];

  // Map users into members shape expected by MembersSidebar
  const members = users.map(u => ({
    ...u,
    online: false,
    status: 'active'
  }));

  // Prepare feeds for ProfileSidebar (it expects posts with user_id etc.)
  const feeds = posts.map(p => ({
    ...p,
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    created_at: p.created_at
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        <h2 className="text-2xl font-semibold mb-4">ผลลัพธ์การค้นหาสำหรับ &quot;{q}&quot;</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left - Members */}
          <div className="lg:col-span-1">
            <MembersSidebar members={members} />
          </div>

          {/* Center - Results */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Interactive posts (client) */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-3">โพสต์ ({posts.length})</h3>
                <SearchResultsClient initialPosts={posts} initialUsers={users} initialMembers={members} />
              </div>

              <section className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-3">สมาชิก ({users.length})</h3>
                {users.length === 0 && <p className="text-gray-500">ไม่พบสมาชิกที่ตรงกับคำค้นหา</p>}
                {users.map((u) => (
                  <a key={u.id} href={`/profile/${u.id}`} className="flex items-center space-x-3 py-3 border-b last:border-b-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                    {u.profile_image ? (
                      <img src={u.profile_image} className="w-10 h-10 rounded-full object-cover" alt={u.name} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm text-white font-semibold">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </a>
                ))}
              </section>
            </div>
          </div>

          {/* Right - Profile */}
          <div className="lg:col-span-1">
            {/* ProfileSidebar is a client component; avoid passing event handlers from this server component. */}
            <ProfileSidebar user={{}} feeds={feeds} members={members} />
          </div>
        </div>
      </div>
    </div>
  );
}
