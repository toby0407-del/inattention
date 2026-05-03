import { Outlet, useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { LayoutDashboard, BarChart2, Settings, LogOut, ChevronDown, Code2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AppLogoMark from '../components/AppLogoMark';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: '數據儀表板', path: '/parent' },
  { icon: BarChart2, label: '專注力報告', path: '/parent/analytics' },
  { icon: Settings, label: '親子設定', path: '/parent/settings' },
  { icon: Code2, label: '開發者通道', path: '/parent/dev' },
];

const CHILDREN = [
  { id: '1', name: '小明', age: 7, avatar: '🦊' },
  { id: '2', name: '小華', age: 9, avatar: '🐼' },
  { id: '3', name: '小芸', age: 6, avatar: '🦋' },
];

export default function ParentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedChild, setSelectedChild, setIsParentAuth, setIsDeveloperAuth, isDeveloperAuth } = useApp();
  const [showChildPicker, setShowChildPicker] = useState(false);

  function handleLogout() {
    setIsParentAuth(false);
    setIsDeveloperAuth(false);
    navigate('/');
  }

  const filteredNav = isDeveloperAuth ? NAV_ITEMS : NAV_ITEMS.filter(n => n.path !== '/parent/dev');
  const currentNav =
    filteredNav.find(n => location.pathname === n.path || location.pathname.startsWith(n.path + '/')) ??
    filteredNav.find(n => location.pathname.startsWith(n.path)) ??
    filteredNav[0];

  return (
    <div className="flex h-screen bg-slate-50" style={{ fontFamily: 'Inter, Nunito, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow border border-white/25"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', boxShadow: '0 4px 14px rgba(13,148,136,0.35)' }}
            >
              <AppLogoMark size={26} />
            </div>
            <div>
              <div className="text-slate-800" style={{ fontWeight: 800, fontSize: '15px' }}>小小聚焦家</div>
              <div className="text-slate-400" style={{ fontWeight: 500, fontSize: '11px' }}>FocusQuest</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: active ? 'linear-gradient(135deg, #e0f9f0, #dbeafe)' : 'transparent',
                  color: active ? '#0f766e' : '#64748b',
                  fontWeight: active ? 700 : 500,
                  fontSize: '14px',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            style={{ fontWeight: 500, fontSize: '14px' }}
          >
            <LogOut size={18} />
            登出 / 切換角色
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between flex-shrink-0 gap-4">
          <div>
            <div className="text-slate-800" style={{ fontWeight: 700, fontSize: '18px' }}>{currentNav.label}</div>
            <div className="text-slate-400" style={{ fontWeight: 500, fontSize: '13px' }}>治療師：林醫師</div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/parent/settings')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
              title="親子設定"
              aria-label="開啟親子設定"
            >
              <Settings size={18} className="text-slate-500 shrink-0" aria-hidden />
              <span className="hidden sm:inline" style={{ fontWeight: 700, fontSize: '14px' }}>
                設定
              </span>
            </button>

            {/* Child switcher */}
          <div className="relative">
            <button
              onClick={() => setShowChildPicker(v => !v)}
              className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all"
            >
              <span className="text-xl">{selectedChild.avatar}</span>
              <div className="text-left">
                <div className="text-slate-700" style={{ fontWeight: 700, fontSize: '14px' }}>{selectedChild.name}</div>
                <div className="text-slate-400" style={{ fontWeight: 500, fontSize: '12px' }}>{selectedChild.age} 歲</div>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {showChildPicker && (
              <motion.div
                className="absolute right-0 top-14 bg-white rounded-2xl shadow-xl border border-slate-100 w-48 overflow-hidden z-50"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {CHILDREN.map(child => (
                  <button
                    key={child.id}
                    onClick={() => { setSelectedChild(child); setShowChildPicker(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all"
                    style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}
                  >
                    <span className="text-xl">{child.avatar}</span>
                    <span>{child.name}</span>
                    {child.id === selectedChild.id && <span className="ml-auto text-teal-500">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
