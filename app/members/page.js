'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar/page';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('/api/members', { headers });
        const data = await response.json();
        
        if (response.ok && data.success) {
          setMembers(data.members || []);
        } else {
          setError(data.error || 'ไม่สามารถโหลดข้อมูลสมาชิกได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const getProfileImage = (member, size = 'w-16 h-16') => {
    const memberKey = member?.id || member?.email || 'unknown';
    const hasImageError = imageErrors[memberKey];
    const hasImage = !!member?.profile_image && !hasImageError;

    return (
      <div className="relative flex-shrink-0">
        {hasImage && (
          <img
            src={member.profile_image}
            alt={`โปรไฟล์ของ ${member.name}`}
            className={`${size} rounded-full object-cover border-4 border-white shadow-lg`}
            onError={() => {
              setImageErrors(prev => ({ ...prev, [memberKey]: true }));
            }}
          />
        )}
        {(!member?.profile_image || hasImageError) && (
          <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-4 border-white shadow-lg`}>
            {member?.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
        )}
        {member?.online && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลสมาชิก...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto p-6 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">สมาชิกทั้งหมด</h1>
          <p className="text-gray-600">รายชื่อสมาชิกในชุมชน ({members.length} คน)</p>
        </div>

        {members.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีสมาชิก</h3>
            <p className="text-gray-500">เป็นคนแรกที่เข้าร่วมชุมชนนี้!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => router.push(`/profile/${member.id}`)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 cursor-pointer group border border-gray-100 hover:border-blue-200"
              >
                <div className="text-center">
                  <div className="mb-4">
                    {getProfileImage(member, 'w-20 h-20 mx-auto')}
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {member.name || 'Unknown User'}
                  </h3>
                  
                  <p className="text-gray-500 text-sm mb-3 truncate">
                    {member.email || 'No email'}
                  </p>

                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    {member.online ? (
                      <span className="flex items-center space-x-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>ออนไลน์</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>ออฟไลน์</span>
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="font-semibold text-blue-600">{member.total_posts || 0}</div>
                        <div className="text-xs text-gray-500">โพสต์</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-500">{member.total_likes_received || 0}</div>
                        <div className="text-xs text-gray-500">ไลค์</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">{member.total_comments_received || 0}</div>
                        <div className="text-xs text-gray-500">คอมเมนต์</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}