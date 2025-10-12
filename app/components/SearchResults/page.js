'use client';
import { useRouter } from 'next/navigation';

export default function SearchResults({ results = { users: [], posts: [] }, query = '' }) {
  const router = useRouter();

  const { users = [], posts = [] } = results || {};

  return (
    <div>
      <div className="p-3 border-b">
        <p className="text-sm text-gray-600">ผลลัพธ์การค้นหาสำหรับ &quot;{query}&quot;</p>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {users.length === 0 && posts.length === 0 && (
          <div className="p-4 text-center text-gray-500">ไม่พบผลลัพธ์</div>
        )}

        {users.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs text-gray-500">สมาชิก ({users.length})</div>
            {users.map((u) => (
              <div
                key={`user-${u.id}`}
                onClick={() => router.push(`/profile?user=${u.id}`)}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
              >
                {u.profile_image ? (
                  <img src={u.profile_image} className="w-8 h-8 rounded-full object-cover" alt={u.name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm text-white">{u.name?.charAt(0)}</div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs text-gray-500">โพสต์ ({posts.length})</div>
            {posts.map((p) => (
              <div
                key={`post-${p.id}`}
                onClick={() => router.push(`/posts/${p.id}`)}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <div className="text-sm text-gray-800 truncate">{p.content}</div>
                <div className="text-xs text-gray-500">โพสต์โดย user #{p.user_id} • {new Date(p.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
