'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { auth } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Yükleniyor spinner — suppressHydrationWarning ile bis_skin_checked hataları bastırılır
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex" suppressHydrationWarning>
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen" suppressHydrationWarning>
        <Header />
        <main className="flex-1 p-8 overflow-y-auto" suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
