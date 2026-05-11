'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi, getApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { Search, Bot, Briefcase, GraduationCap, Users, TrendingUp, Mail } from 'lucide-react';

export default function BusinessDashboard() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const user = auth.getUserData();
    setIsSearching(true);
    try {
      // Önce user-service'ten öğrenci listesi çek, sonra filtrele
      const res = await userApi.get('/api/v1/users/?role=student');
      const students = res.data?.users ?? res.data ?? [];
      // Basit keyword arama (AI endpoint hazır olunca değiştirilebilir)
      const q = query.toLowerCase();
      const matched = students.filter((s: any) =>
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.surname ?? '').toLowerCase().includes(q)
      );
      setResults(matched);
      if (matched.length === 0) toast('Eşleşen öğrenci bulunamadı.', { icon: '🔍' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleContact = (student: any) => {
    toast.success(`${student.name ?? student.email} ile iletişim talebi gönderildi!`);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Briefcase,   label: 'Aktif İlanım',    value: '2', color: 'text-[#818cf8]' },
          { icon: Users,       label: 'Toplam Başvuru',  value: '11', color: 'text-blue-400' },
          { icon: TrendingUp,  label: 'Bu Ay Görüntüleme', value: '84', color: 'text-green-400' },
        ].map(s => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-[rgba(99,102,241,0.15)] ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#64748b]">{s.label}</p>
              <p className={`text-3xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Search */}
      <Card className="border border-[rgba(99,102,241,0.3)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Yapay Zeka Destekli Stajyer Arama</CardTitle>
              <CardDescription>Doğal dil ile yetenek ve profil araması yapın.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="mt-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Örn: Python ve React bilen, bilgisayar mühendisliği öğrencisi..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#2a2a3e] border border-[#3a3a52] rounded-xl text-white placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
            <Button type="submit" size="lg" isLoading={isSearching}>
              <Search className="w-4 h-4 mr-2" />
              Öğrenci Bul
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            {results.map((s: any) => (
              <div key={s.id} className="p-4 rounded-xl bg-[rgba(42,42,62,0.8)] border border-[rgba(99,102,241,0.2)] hover:border-[#6366f1]/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold shrink-0">
                    {(s.name?.[0] ?? s.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.name} {s.surname}</p>
                    <p className="text-xs text-[#64748b]">{s.email}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleContact(s)}>
                  <Mail className="w-3.5 h-3.5 mr-1.5" /> İletişim Kur
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-hover cursor-pointer" onClick={() => router.push('/business/listings')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[rgba(99,102,241,0.15)]">
              <Briefcase className="w-6 h-6 text-[#818cf8]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">İlanlarımı Yönet</h3>
              <p className="text-sm text-[#64748b]">Staj ilanlarını oluştur ve takip et</p>
            </div>
          </div>
        </Card>
        <Card className="card-hover cursor-pointer" onClick={() => router.push('/business/search')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[rgba(99,102,241,0.15)]">
              <GraduationCap className="w-6 h-6 text-[#818cf8]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Stajyer Ara</h3>
              <p className="text-sm text-[#64748b]">Tüm öğrencileri listele ve filtrele</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
