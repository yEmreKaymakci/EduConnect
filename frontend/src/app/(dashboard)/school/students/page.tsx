'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi, getApiError } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { GraduationCap, Search, RefreshCw, Mail, BookOpen } from 'lucide-react';

interface Student {
  id: number;
  email: string;
  name?: string;
  surname?: string;
  is_active: boolean;
}

export default function SchoolStudentsPage() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [filtered, setFiltered]   = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState('');

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userApi.get('/api/v1/users/?role=student');
      const data = res.data?.users ?? res.data ?? [];
      setStudents(data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      students.filter(s =>
        !q ||
        s.email.toLowerCase().includes(q) ||
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.surname ?? '').toLowerCase().includes(q)
      )
    );
  }, [students, search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-[#818cf8]" />
            Öğrenci Listesi
          </h1>
          <p className="text-[#64748b] text-sm mt-1">Sisteme kayıtlı öğrenciler</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStudents} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" /> Yenile
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ad, soyad veya e-posta ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Öğrenciler ({filtered.length})</CardTitle>
          <CardDescription>Sisteme kayıtlı ve aktif olan öğrencileriniz</CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#64748b]">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? 'Aramanızla eşleşen öğrenci bulunamadı.' : 'Henüz kayıtlı öğrenci yok.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.2)]">
                  {['Öğrenci', 'E-posta', 'Durum', 'Detay'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[#64748b] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(99,102,241,0.1)]">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(s.name?.[0] ?? s.email[0]).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">
                          {s.name} {s.surname}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#94a3b8]">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> {s.email}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.is_active
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {s.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Button variant="ghost" size="sm">
                        <BookOpen className="w-3.5 h-3.5 mr-1" /> Profil
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
