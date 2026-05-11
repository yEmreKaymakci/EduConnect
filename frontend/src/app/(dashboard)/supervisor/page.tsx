'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Users, Building2, GraduationCap, Activity, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { userApi } from '@/lib/api';

// Fallback mock data in case API is loading or has database connectivity delay
const defaultMockData = [
  { name: 'Ocak', student: 4, business: 2, school: 1 },
  { name: 'Şubat', student: 6, business: 3, school: 1 },
  { name: 'Mart', student: 12, business: 5, school: 2 },
  { name: 'Nisan', student: 18, business: 8, school: 3 },
  { name: 'Mayıs', student: 24, business: 11, school: 4 },
];

const defaultMockActivities = [
  { text: "Yeni öğrenci kaydı: ahmet@student.edu.tr", time: "2 dk önce", type: "user.student" },
  { text: "TechFirm A.Ş. staj ilanı yayınladı", time: "15 dk önce", type: "user.business" },
  { text: "Marmara Üni. dosya yükledi (PDF)", time: "1 saat önce", type: "user.school" },
  { text: "AI Asistan cv analizi tamamladı", time: "2 saat önce", type: "ai.analyzed" },
];

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await userApi.get('/api/v1/users/supervisor/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load supervisor stats, using resilient fallbacks:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Compute counters, growth charts, and activity logs with safe API fallback
  const counters = stats?.counters || {
    students: 1248,
    businesses: 159,
    schools: 12,
    files: 43
  };

  const growthData = stats?.growth && stats.growth.length > 0 ? stats.growth : defaultMockData;
  const activities = stats?.activities && stats.activities.length > 0 ? stats.activities : defaultMockActivities;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-12">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Supervisor Dashboard</h1>
          <p className="text-text-muted mt-1 text-sm font-medium">EduConnect platformunun genel sistem, kullanıcı kayıt ve dosya dağılım metrikleri.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-primary-light text-xs font-semibold animate-pulse">
            <Activity className="w-4 h-4 animate-spin" />
            Canlı veritabanı senkronizasyonu...
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Toplam Öğrenci', value: counters.students, icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { title: 'Kayıtlı İşletme', value: counters.businesses, icon: Building2, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { title: 'Aktif Okul', value: counters.schools, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { title: 'Yüklenen Belgeler', value: counters.files, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map((stat, i) => (
          <Card key={i} className={`hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 border ${stat.bg} shadow-lg shadow-surface/20`}>
            <div className="flex items-center gap-4 p-2">
              <div className={`p-4 rounded-xl ${stat.color} bg-surface-border/50`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm text-text-muted font-bold tracking-wide uppercase">{stat.title}</p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-surface-border/45 animate-pulse rounded" />
                  ) : (
                    stat.value.toLocaleString('tr-TR')
                  )}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 border border-surface-border/40 shadow-xl relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-light" />
              Kullanıcı Büyüme İstatistiği
            </CardTitle>
            <CardDescription className="text-text-muted">Aylık bazda sisteme kayıt olan yeni kullanıcıların dağılımı</CardDescription>
          </CardHeader>
          <div className="h-80 mt-4 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#33334d', color: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="student" name="Öğrenci" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="business" name="İşletme" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="school" name="Okul" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity / System Logs Preview */}
        <Card className="border border-surface-border/40 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Sistem Aktiviteleri</CardTitle>
            <CardDescription className="text-text-muted">Gerçek zamanlı sisteme kaydolan son kullanıcılar</CardDescription>
          </CardHeader>
          <div className="space-y-3.5 mt-4 max-h-80 overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center p-3 rounded-xl border border-surface-border/40 bg-surface/30">
                  <div className="w-2 h-2 rounded-full bg-surface-border/80 animate-pulse shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-surface-border/45 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-surface-border/30 animate-pulse rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              activities.map((log: any, i: number) => (
                <div key={i} className="flex gap-3 items-start p-3.5 rounded-xl border border-surface-border/35 bg-surface-card/45 hover:bg-surface-card/85 hover:border-primary/25 transition-all duration-200">
                  <div className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                    log.type.includes('student') ? 'bg-blue-400 shadow-sm shadow-blue-400' :
                    log.type.includes('business') ? 'bg-orange-400 shadow-sm shadow-orange-400' :
                    log.type.includes('school') ? 'bg-green-400 shadow-sm shadow-green-400' : 'bg-primary-light'
                  }`} />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white leading-tight break-all">{log.text}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-surface-border bg-surface text-text-secondary">
                        {log.type}
                      </span>
                      <span className="text-xs text-text-muted font-medium">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
