'use client';

import { useMemo } from 'react';
import Link from 'next/link';

// --- Component ย่อยสำหรับแสดง Avatar ---
// ถูกแยกออกมาเพื่อให้อ่านง่ายและจัดการสะดวก
const Avatar = ({ member }) => {
  const initial = member?.name?.charAt(0)?.toUpperCase() || 'M';
  const hasImage = !!member?.profile_image;

  return (
    <div className="relative flex-shrink-0">
      {/* แสดงรูปภาพจริงถ้ามี */}
      {hasImage && (
        <img
          src={member.profile_image}
          alt={`โปรไฟล์ของ ${member.name}`}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-blue-300 transition-all duration-200 group-hover:scale-110"
        />
      )}
      {/* ถ้าไม่มีรูปภาพ จะแสดงเป็นตัวอักษรแรกของชื่อ */}
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform duration-200 ${hasImage ? 'hidden' : 'flex'}`}
      >
        {initial}
      </div>
      {/* จุดแสดงสถานะออนไลน์ */}
      {member?.online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

// --- Component ย่อยสำหรับแสดงรายการสมาชิกแต่ละคน ---
// ใช้ <Link> เพื่อการนำทางที่เป็นมาตรฐานของ Next.js
const MemberItem = ({ member }) => {
  if (!member?.id) return null;

  return (
    <Link
      href={`/profile/${member.id}`}
      className="flex items-center space-x-3 p-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 cursor-pointer group hover:shadow-sm"
      aria-label={`ดูโปรไฟล์ของ ${member.name}`}
    >
      <Avatar member={member} />
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
export default function MembersSidebar({ members = [] }) {
  // ใช้ useMemo เพื่อคำนวณค่าต่างๆ แค่ครั้งเดียวเมื่อ `members` เปลี่ยนแปลง เพื่อประสิทธิภาพที่ดีขึ้น
  const { safeMembers, onlineCount } = useMemo(() => {
    const validMembers = Array.isArray(members) ? members.filter(Boolean) : [];
    const online = validMembers.filter(m => m.online).length;
    return { safeMembers: validMembers, onlineCount: online };
  }, [members]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      {/* ส่วนหัว */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          สมาชิก
        </h3>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
          {safeMembers.length}
        </span>
      </div>

      {/* ส่วนสถิติ */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-sm text-gray-700">ออนไลน์</span></div>
          <span className="font-semibold text-green-600">{onlineCount}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2"><svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg><span className="text-sm text-gray-700">สมาชิกทั้งหมด</span></div>
          <span className="font-semibold text-blue-600">{safeMembers.length}</span>
        </div>
      </div>

      {/* ส่วนรายชื่อสมาชิก */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-2 py-2">
          รายชื่อสมาชิก
        </h4>
        <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          {safeMembers.length > 0 ? (
            safeMembers.map((member) => <MemberItem key={member.id} member={member} />)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">ยังไม่มีสมาชิก</p>
            </div>
          )}
        </div>
      </div>
      
      {/* ส่วนท้าย */}
      <div className="border-t pt-4 mt-6">
        <Link 
          href="/members"
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
        >
          <span>ดูสมาชิกทั้งหมด</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </div>

      {/* สไตล์สำหรับ Custom Scrollbar (รวมไว้ในไฟล์เดียว) */}
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
  );
}