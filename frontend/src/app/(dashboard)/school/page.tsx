'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi, getApiError } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { GraduationCap, MoreVertical, FileDown, Users, TrendingUp, CheckCircle } from 'lucide-react';

export default function SchoolDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await userApi.get('/api/v1/users/?role=student');
        setStudents(res.data?.users ?? res.data ?? []);
      } catch (err) {
        toast.error(getApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleGenerateReport = () => {
    const lines = [
      'EduConnect - Okul Raporu',
      `Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
      '---',
      `Toplam Öğrenci: ${students.length}`,
      `Aktif Öğrenci: ${students.filter(s => s.is_active).length}`,
      '---',
      'Öğrenci Listesi:',
      ...students.map(s => `- ${s.name ?? ''} ${s.surname ?? ''} <${s.email}>`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `educonnect_rapor_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rapor indirildi!');
  };

  const stats = [
    { icon: Users,       label: 'Toplam Öğrenci', value: students.length,                          color: 'text-[#818cf8]' },
    { icon: CheckCircle, label: 'Aktif',           value: students.filter(s => s.is_active).length, color: 'text-green-400' },
    { icon: TrendingUp,  label: 'Bu Ay Kayıt',     value: students.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        const n = new Date();
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
      }).length, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Okul Yönetim Paneli</h1>
          <p className="text-[#64748b] text-sm mt-1">Öğrenci listesi ve staj durumları</p>
        </div>
        <Button onClick={handleGenerateReport} disabled={isLoading || students.length === 0}>
          <FileDown className="w-4 h-4 mr-2" />
          Rapor Oluştur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-[rgba(99,102,241,0.15)] ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#64748b]">{s.label}</p>
              <p className={`text-3xl font-bold mt-0.5 ${s.color}`}>{isLoading ? '—' : s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-hover cursor-pointer" onClick={() => router.push('/school/students')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[rgba(99,102,241,0.15)]"><GraduationCap className="w-6 h-6 text-[#818cf8]" /></div>
            <div>
              <h3 className="font-semibold text-white">Öğrenci Listesi</h3>
              <p className="text-sm text-[#64748b]">Tüm öğrencileri görüntüle ve yönet</p>
            </div>
          </div>
        </Card>
        <Card className="card-hover cursor-pointer" onClick={() => router.push('/school/internships')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[rgba(99,102,241,0.15)]"><TrendingUp className="w-6 h-6 text-[#818cf8]" /></div>
            <div>
              <h3 className="font-semibold text-white">Staj Yönetimi</h3>
              <p className="text-sm text-[#64748b]">Staj başvurularını onayla ve takip et</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Student preview table */}
      <Card>
        <CardHeader>
          <CardTitle>Son Kayıtlı Öğrenciler</CardTitle>
          <CardDescription>Sisteme en son kayıt olan öğrenciler</CardDescription>
        </CardHeader>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.2)]">
                {['Öğrenci', 'E-posta', 'Durum', ''].map(h => (
                  <th key={h} className="py-3 px-4 text-sm font-medium text-[#64748b]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-[#64748b]">Yükleniyor...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[#64748b]">Henüz kayıtlı öğrenci bulunmuyor.</td></tr>
              ) : students.slice(0, 5).map((student: any) => (
                <tr key={student.id} className="border-b border-[rgba(99,102,241,0.1)] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-sm font-bold">
                        {(student.name?.[0] ?? student.email[0]).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{student.name} {student.surname}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#94a3b8]">{student.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      student.is_active
                        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {student.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-1.5 text-[#64748b] hover:text-white rounded hover:bg-[rgba(42,42,62,0.8)] transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 5 && (
            <div className="text-center py-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/school/students')}>
                Tüm öğrencileri gör ({students.length})
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
