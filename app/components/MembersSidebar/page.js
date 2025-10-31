'use client';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// --- Component ย่อยสำหรับแสดง Avatar ---
const Avatar = ({ member, imageErrors, setImageErrors }) => {
  const initial = member?.name?.charAt(0)?.toUpperCase() || 'M';
  const memberKey = member?.id || member?.email || 'unknown';
  const hasImageError = imageErrors[memberKey];
  const hasImage = !!member?.profile_image && !hasImageError;
  const isOnline = member?.online === true;

  return (
    <div className="relative flex-shrink-0">
      {hasImage && (
        <img
          src={member.profile_image}
          alt={`โปรไฟล์ของ ${member.name}`}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-blue-300 transition-all duration-200 group-hover:scale-110"
          onError={() => {
            setImageErrors(prev => ({ ...prev, [memberKey]: true }));
          }}
        />
      )}
      {(!member?.profile_image || hasImageError) && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform duration-200">
          {initial}
        </div>
      )}
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

// --- Component ย่อยสำหรับแสดงรายการสมาชิกแต่ละคน ---
const MemberItem = ({ member, imageErrors, setImageErrors }) => {
  if (!member?.id) return null;

  return (
    <Link
      href={`/profile/${member.id}`}
      className="flex items-center space-x-3 p-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 cursor-pointer group hover:shadow-sm"
      aria-label={`ดูโปรไฟล์ของ ${member.name}`}
    >
      <Avatar member={member} imageErrors={imageErrors} setImageErrors={setImageErrors} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
          {member.name || 'Unknown User'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {member.email || 'No email'}
        </p>
      </div>
      <svg
        className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform duration-200"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
};

// --- Component หลัก: MembersSidebar ---
function MembersSidebarContent({ members = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [portalEl, setPortalEl] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // ใช้ useMemo เพื่อคำนวณค่าต่างๆ เพื่อประสิทธิภาพที่ดีขึ้น
  const { safeMembers, onlineCount } = useMemo(() => {
    const validMembers = Array.isArray(members) ? members.filter(Boolean) : [];
    const online = validMembers.filter(m => m?.online === true).length;
    return { safeMembers: validMembers, onlineCount: online };
  }, [members]);

  // Create portal root
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('id', 'members-modal-root');
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      try { 
        document.body.removeChild(el); 
      } catch (e) {
        console.error('Error removing portal element:', e);
      }
    };
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  // Modal Content
  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={() => setShowModal(false)}
      ></div>
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-lg font-semibold text-gray-800">
            สมาชิกทั้งหมด ({safeMembers.length})
          </h3>
          <button 
            onClick={() => setShowModal(false)} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full p-2 transition-all duration-200"
            aria-label="ปิด"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(80vh - 72px)' }}>
          <div className="space-y-2">
            {safeMembers.map((member) => (
              <MemberItem 
                key={member?.id} 
                member={member}
                imageErrors={imageErrors}
                setImageErrors={setImageErrors}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        {/* ส่วนหัว */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            สมาชิก
          </h3>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
            {safeMembers.length}
          </span>
        </div>

        {/* ส่วนรายชื่อสมาชิก */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-2 py-2">
            รายชื่อสมาชิก
          </h4>
          <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {safeMembers.length > 0 ? (
              safeMembers.slice(0, 4).map((member) => (
                <MemberItem 
                  key={member?.id} 
                  member={member}
                  imageErrors={imageErrors}
                  setImageErrors={setImageErrors}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">ยังไม่มีสมาชิก</p>
              </div>
            )}
          </div>
        </div>
        
        {/* ส่วนท้าย */}
        <div className="border-t pt-4 mt-6">
          {safeMembers.length > 4 ? (
            <button
              onClick={() => setShowModal(true)}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              <span>ดูสมาชิกทั้งหมด</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <Link 
              href="/members"
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              <span>ดูสมาชิกทั้งหมด</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>

        {/* สไตล์สำหรับ Custom Scrollbar */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #2563eb, #7c3aed);
          }
        `}</style>
      </div>

      {/* Modal for showing all members (render via portal) */}
      {showModal && portalEl && createPortal(modalContent, portalEl)}
    </>
  );
}

// --- Wrapper Component ที่ดึง data จาก API ---
export default function MembersSidebar() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('/api/members', { headers });
        const data = await response.json();
        
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members);
        } else {
          setError('ไม่สามารถโหลดข้อมูลสมาชิก');
        }
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return <MembersSidebarContent members={members} />;
}