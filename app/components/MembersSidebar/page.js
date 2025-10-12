'use client';

export default function MembersSidebar({ members = [] }) {
  // ✅ Safe array check
  const safeMembers = Array.isArray(members) ? members : [];
  const activeMembersCount = safeMembers.filter(m => m?.status === 'active').length;
  const onlineCount = safeMembers.filter(m => m?.online).length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      {/* Header */}
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

      {/* Stats */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">ออนไลน์</span>
          </div>
          <span className="font-semibold text-green-600">{onlineCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">สมาชิกทั้งหมด</span>
          </div>
          <span className="font-semibold text-blue-600">{safeMembers.length}</span>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-2 py-2">
          รายชื่อสมาชิก
        </h4>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {safeMembers.length > 0 ? (
            safeMembers.map((member) => (
              <div
                key={member?.id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer group"
              >
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  {member?.profile_image ? (
                    <img
                      src={member.profile_image}
                      alt={member?.name || 'Member'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm"
                    style={{
                      display: member?.profile_image ? 'none' : 'flex'
                    }}
                  >
                    {member?.name?.charAt(0)?.toUpperCase() || 'M'}
                  </div>

                  {/* Online Indicator */}
                  {member?.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                    {member?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {member?.email || 'No email'}
                  </p>
                </div>

                {/* Status Badge */}
                {member?.online && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    ออนไลน์
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">ยังไม่มีสมาชิก</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 mt-6">
        <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
          ดูสมาชิกทั้งหมด →
        </button>
      </div>
    </div>
  );
}