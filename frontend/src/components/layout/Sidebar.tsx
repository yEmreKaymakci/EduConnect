'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, UserData } from '@/lib/auth';
import { LayoutDashboard, Users, FileText, Briefcase, Settings2, UserCog, Shield, LogOut, Bot } from 'lucide-react';
import { authApi } from '@/lib/api';

const menuConfig = {
  supervisor: [
    { name: 'Dashboard', path: '/supervisor', icon: LayoutDashboard },
    { name: 'Kullanıcı Yönetimi', path: '/supervisor/users', icon: UserCog },
    { name: 'İzin Yönetimi', path: '/supervisor/permissions', icon: Shield },
  ],
  student: [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'CV & Profil', path: '/student/cv', icon: FileText },
    { name: 'YZ Asistanı', path: '/student/ai-assistant', icon: Bot },
    { name: 'Projeler', path: '/student/portfolio', icon: Briefcase },
  ],
  school: [
    { name: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { name: 'Öğrenciler', path: '/school/students', icon: Users },
    { name: 'Staj Yönetimi', path: '/school/internships', icon: Settings2 },
  ],
  business: [
    { name: 'Dashboard', path: '/business', icon: LayoutDashboard },
    { name: 'Stajyer Ara', path: '/business/search', icon: Users },
    { name: 'İlanlarım', path: '/business/listings', icon: Briefcase },
  ]
};

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [screens, setScreens] = useState<any[]>([]);

  useEffect(() => {
    const userData = auth.getUserData();
    setUser(userData);
    
    // Yüklenen rollere göre ekranları çek
    if (userData) {
      authApi.get(`/api/v1/auth/screens/${userData.user_id}`).then(res => {
        setScreens(res.data.screens);
      }).catch(err => console.error("Screens fetch error:", err));
    }
  }, []);

  if (!user) return null;

  const roleMenus = menuConfig[user.role] || [];
  
  // Eğer sunucudan özel bir dinamik ekran listesi gelirse, onu da buraya dahil edebiliriz.
  // Şimdilik varsayılan roleMenus kullanıyoruz.

  return (
    <aside className="w-64 border-r border-surface-border bg-surface/50 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <Link href={`/${user.role}`} className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent glow">
          <span>🎓</span>
          EduConnect
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
          {user.role.toUpperCase()} PANEL
        </div>
        {roleMenus.map((menu) => {
          const isActive = pathname === menu.path || pathname?.startsWith(`${menu.path}/`);
          const Icon = menu.icon;
          return (
            <Link
              key={menu.path}
              href={menu.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary/20 text-primary-light border border-primary/30' 
                  : 'text-text-secondary hover:bg-surface-card hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-white'}`} />
              <span className="font-medium">{menu.name}</span>
            </Link>
          );
        })}


      </div>

      <div className="p-4 border-t border-surface-border">
        <div className="glass p-3 rounded-xl flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.email}</p>
            <p className="text-xs text-text-muted capitalize">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={() => { auth.logout(); window.location.href='/login'; }}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
