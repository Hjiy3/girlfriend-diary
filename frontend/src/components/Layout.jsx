import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, Image, Heart, BarChart3, Settings, Cloud, CloudOff, Loader } from 'lucide-react';
import { onSyncStatusChange, getOnlineStatus, checkOnlineStatus } from '../services/sync';

function Layout() {
  const [syncStatus, setSyncStatus] = useState({
    online: false,
    syncing: false
  });

  useEffect(() => {
    // 初始檢查
    checkOnlineStatus().then(online => {
      setSyncStatus(prev => ({ ...prev, online }));
    });

    // 監聽同步狀態變化
    const unsubscribe = onSyncStatusChange((status) => {
      setSyncStatus(prev => ({
        ...prev,
        syncing: status.syncing,
        online: getOnlineStatus()
      }));
    });

    // 定時更新狀態
    const interval = setInterval(() => {
      setSyncStatus(prev => ({ ...prev, online: getOnlineStatus() }));
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { to: '/', icon: Home, label: '首頁' },
    { to: '/calendar', icon: Calendar, label: '日曆' },
    { to: '/gallery', icon: Image, label: '相簿' },
    { to: '/anniversaries', icon: Heart, label: '紀念日' },
    { to: '/stats', icon: BarChart3, label: '統計' },
    { to: '/settings', icon: Settings, label: '設定' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 pb-20">
      {/* 同步狀態指示器 */}
      <div className="fixed top-2 right-2 z-50">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          syncStatus.syncing 
            ? 'bg-blue-100 text-blue-600'
            : syncStatus.online 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-500'
        }`}>
          {syncStatus.syncing ? (
            <>
              <Loader size={12} className="animate-spin" />
              <span>同步中</span>
            </>
          ) : syncStatus.online ? (
            <>
              <Cloud size={12} />
              <span>已連線</span>
            </>
          ) : (
            <>
              <CloudOff size={12} />
              <span>離線</span>
            </>
          )}
        </div>
      </div>

      {/* 主要內容區 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* 底部導航列 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 shadow-lg">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-pink-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs mt-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Layout;