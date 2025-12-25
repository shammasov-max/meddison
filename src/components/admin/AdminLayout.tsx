import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Globe, Search, MapPin, Calendar } from 'lucide-react';

export const AdminLayout = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Дашборд', path: '/admin/dashboard' },
    { icon: MapPin, label: 'Локации', path: '/admin/locations' },
    { icon: FileText, label: 'Новости', path: '/admin/news' },
    { icon: Settings, label: 'Контент', path: '/admin/content' },
    { icon: Calendar, label: 'Бронирование', path: '/admin/booking-settings' },
    { icon: Search, label: 'SEO', path: '/admin/seo' },
  ];

  return (
    <div className="min-h-screen bg-black flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-zinc-950 border-r border-white/5 flex flex-col fixed h-full z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="font-serif font-bold text-black text-xl">M</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Medisson</h2>
              <span className="text-xs text-white/40 uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Меню</p>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? 'bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={location.pathname === item.path ? 'text-black' : 'group-hover:text-amber-500 transition-colors'} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-2 bg-zinc-950">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Globe size={20} />
            На сайт
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-72 bg-black min-h-screen">
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
