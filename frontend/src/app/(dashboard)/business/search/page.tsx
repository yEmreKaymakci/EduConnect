'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi, getApiError } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Users, Search, Filter, GraduationCap, Mail, Star, BookOpen } from 'lucide-react';

interface Student {
  id: number;
  email: string;
  name?: string;
  surname?: string;
  is_active: boolean;
}

export default function BusinessSearchPage() {
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

  const handleContact = (student: Student) => {
    toast.success(`${student.name ?? student.email} ile iletişim talebi gönderildi!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-[#818cf8]" />
          Stajyer Ara
        </h1>
        <p className="text-[#64748b] text-sm mt-1">
          Sisteme kayıtlı öğrencileri inceleyin ve stajyer arayışınızı yönetin.
        </p>
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Öğrenci ara..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
            />
          </div>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 mr-2" /> Filtrele
          </Button>
        </div>
      </Card>

      {/* Student Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Users className="w-12 h-12 text-[#64748b] mx-auto mb-3 opacity-30" />
          <p className="text-[#64748b]">{search ? 'Aramanızla eşleşen öğrenci bulunamadı.' : 'Henüz kayıtlı öğrenci yok.'}</p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-[#64748b]">{filtered.length} öğrenci listeleniyor</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(s => (
              <Card key={s.id} className="card-hover flex flex-col gap-3">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(s.name?.[0] ?? s.email[0]).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate">
                      {s.name ?? ''} {s.surname ?? ''}
                      {!s.name && !s.surname && <span className="text-[#64748b]">—</span>}
                    </p>
                    <span className={`text-xs ${s.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {s.is_active ? '● Aktif' : '● Pasif'}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>

                {/* Mock skills */}
                <div className="flex gap-1.5 flex-wrap">
                  {['React', 'Python', 'SQL'].map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] text-xs border border-[#6366f1]/25">
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[rgba(99,102,241,0.15)] mt-auto">
                  <Button size="sm" onClick={() => handleContact(s)} className="flex-1">
                    <Mail className="w-3.5 h-3.5 mr-1.5" /> İletişim
                  </Button>
                  <Button size="sm" variant="outline">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Profil
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
