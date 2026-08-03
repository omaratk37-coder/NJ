import React from 'react';
import { 
  Home, Calendar, BookOpen, Users, Star, Image, BarChart3, Settings, LogOut, ShieldAlert, GraduationCap, HelpCircle
} from 'lucide-react';
import { AdminUser } from '../../types';
import { LogoHorizontal } from '../Logo';

interface AdminSidebarProps {
  currentUser: AdminUser;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ currentUser, activeView, setActiveView, onLogout }: AdminSidebarProps) {
  
  const menuItems = [
    { key: 'ad_home', label: 'الرئيسية', icon: <Home className="w-4 h-4" />, roles: ['superadmin', 'manager', 'teacher'] },
    { key: 'ad_bookings', label: 'الحجوزات', icon: <Calendar className="w-4 h-4" />, roles: ['superadmin', 'manager'] },
    { key: 'ad_courses', label: 'الدورات القديرة', icon: <BookOpen className="w-4 h-4" />, roles: ['superadmin', 'manager', 'teacher'] },
    { key: 'ad_students', label: 'سجلات الطلاب', icon: <Users className="w-4 h-4" />, roles: ['superadmin', 'manager'] },
    { key: 'ad_enrolled_students', label: 'الطلاب المسجلون', icon: <GraduationCap className="w-4 h-4" />, roles: ['superadmin', 'manager', 'teacher'] },
    { key: 'ad_reviews', label: 'الآراء والمراجعة', icon: <Star className="w-4 h-4" />, roles: ['superadmin', 'manager'] },
    { key: 'ad_media', label: 'الوسائط والمعرض', icon: <Image className="w-4 h-4" />, roles: ['superadmin', 'manager'] },
    { key: 'ad_faq', label: 'الأسئلة الشائعة', icon: <HelpCircle className="w-4 h-4" />, roles: ['superadmin', 'manager'] },
    { key: 'ad_analytics', label: 'الإحصائيات العميقة', icon: <BarChart3 className="w-4 h-4" />, roles: ['superadmin', 'manager'] },
    { key: 'ad_settings', label: 'الإعدادات العامة', icon: <Settings className="w-4 h-4" />, roles: ['superadmin'] } // superadmin only as requested
  ];

  // Filter menu items by user role authorization
  const authorizedItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="w-56 shrink-0 bg-navy text-slate-300 flex flex-col justify-between border-l border-navy-dark h-screen sticky top-0 font-sans shadow-lg select-none print:hidden" style={{ direction: 'rtl' }}>
      
      <div className="space-y-6">
        {/* Brand visual header area */}
        <div className="p-4 border-b border-white/5 bg-navy-dark">
          <LogoHorizontal 
            size={34} 
            variant="light" 
            academyName="أكاديمية ناجي" 
          />
        </div>

        {/* Current Active User Profile Area */}
        <div className="mx-4 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-600 border border-gold flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
            <span className="text-white font-bold">{currentUser.name.trim().split(' ').pop()?.substring(0, 2) || 'NA'}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
            {currentUser.role === 'superadmin' && (
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[8.5px] font-black bg-rose-500/25 border border-rose-500/20 text-rose-300 rounded">Super Admin</span>
            )}
            {currentUser.role === 'manager' && (
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[8.5px] font-black bg-gold/20 border border-gold/30 text-gold-light rounded">مسيّر أعمال</span>
            )}
            {currentUser.role === 'teacher' && (
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[8.5px] font-black bg-emerald-500/25 border border-emerald-500/20 text-emerald-300 rounded">أستاذ معتمد</span>
            )}
          </div>
        </div>

        {/* Dynamic navigational links */}
        <nav className="px-3 space-y-1">
          {authorizedItems.map((item) => {
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  isActive 
                    ? 'bg-gold/15 text-gold border-r-3 border-gold' 
                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <span className={`${isActive ? 'text-gold' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout triggers at bottom */}
      <div className="p-4 border-t border-white/5 bg-navy-dark/40">
        <button
          onClick={onLogout}
          className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج آمن من الجلسة</span>
        </button>
      </div>

    </aside>
  );
}
