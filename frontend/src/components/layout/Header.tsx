'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { auth, UserData } from '@/lib/auth';

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    setUser(auth.getUserData());
  }, []);

  // Simple title generator based on path
  const getTitle = () => {
    if (pathname === '/supervisor') return 'Supervisor Dashboard';
    if (pathname?.includes('/users')) return 'Kullanıcı Yönetimi';
    if (pathname?.includes('/permissions')) return 'İzin Yönetimi';
    if (pathname === '/student') return 'Öğrenci Dashboard';
    if (pathname?.includes('/cv')) return 'CV ve Profil';
    if (pathname?.includes('/ai-assistant')) return 'YZ Asistanı';
    if (pathname === '/school') return 'Okul Dashboard';
    if (pathname === '/business') return 'İşletme Dashboard';
    if (pathname?.includes('/editor')) return 'HTML Editör';
    return 'Dashboard';
  };

  return (
    <header className="h-20 border-b border-surface-border bg-surface/30 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">{getTitle()}</h1>
        <p className="text-sm text-text-muted">Hoş geldin, {user?.email.split('@')[0]}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Ara..." 
            className="pl-10 pr-4 py-2 bg-surface-card border border-border rounded-full text-sm text-white focus:outline-none focus:border-primary-light transition-colors w-64"
          />
        </div>

        <button className="relative p-2 text-text-secondary hover:text-white transition-colors rounded-full hover:bg-surface-card">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
        </button>
      </div>
    </header>
  );
}
