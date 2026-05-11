'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Settings2, Plus, Calendar, Building2, GraduationCap, Clock } from 'lucide-react';

interface Internship {
  id: number;
  studentName: string;
  company: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
}

const MOCK_INTERNSHIPS: Internship[] = [
  { id: 1, studentName: 'Ahmet Yılmaz', company: 'TechFirm A.Ş.',   startDate: '2026-06-01', endDate: '2026-08-31', status: 'approved' },
  { id: 2, studentName: 'Zeynep Kaya',  company: 'StartupHub Ltd.',  startDate: '2026-07-01', endDate: '2026-09-30', status: 'pending' },
  { id: 3, studentName: 'Emre Demir',   company: 'GlobalTech Inc.',  startDate: '2025-06-01', endDate: '2025-08-31', status: 'completed' },
];

const STATUS_CONFIG = {
  pending:   { label: 'Bekliyor',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  approved:  { label: 'Onaylı',   cls: 'bg-green-500/15  text-green-400  border-green-500/30' },
  completed: { label: 'Tamamlandı', cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30' },
  rejected:  { label: 'Reddedildi', cls: 'bg-red-500/15    text-red-400    border-red-500/30' },
};

export default function SchoolInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>(MOCK_INTERNSHIPS);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentName: '', company: '', startDate: '', endDate: '' });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('school_internships');
    if (saved) {
      try {
        setInternships(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading internships from localStorage', e);
      }
    }
  }, []);

  // Helper to update & save internships
  const saveAndSetInternships = (updated: Internship[]) => {
    setInternships(updated);
    localStorage.setItem('school_internships', JSON.stringify(updated));
  };

  const filtered = filter === 'all' ? internships : internships.filter(i => i.status === filter);

  const handleApprove = (id: number) => {
    const updated = internships.map(i => i.id === id ? { ...i, status: 'approved' as const } : i);
    saveAndSetInternships(updated);
    toast.success('Staj onaylandı!');
  };

  const handleReject = (id: number) => {
    const updated = internships.map(i => i.id === id ? { ...i, status: 'rejected' as const } : i);
    saveAndSetInternships(updated);
    toast.error('Staj reddedildi.');
  };

  const handleAdd = () => {
    if (!form.studentName.trim() || !form.company.trim() || !form.startDate || !form.endDate) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }
    const newInternship: Internship = {
      id: Date.now(),
      studentName: form.studentName.trim(),
      company: form.company.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: 'pending'
    };
    const updated = [newInternship, ...internships];
    saveAndSetInternships(updated);
    setForm({ studentName: '', company: '', startDate: '', endDate: '' });
    setShowForm(false);
    toast.success('Staj kaydı başarıyla eklendi!');
  };

  const stats = {
    total:     internships.length,
    pending:   internships.filter(i => i.status === 'pending').length,
    approved:  internships.filter(i => i.status === 'approved').length,
    completed: internships.filter(i => i.status === 'completed').length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings2 className="w-7 h-7 text-[#818cf8]" />
            Staj Yönetimi
          </h1>
          <p className="text-[#64748b] text-sm mt-1">Öğrencilerin staj başvurularını yönetin</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4 mr-2" /> Staj Ekle
        </Button>
      </div>

      {/* Add Form Card */}
      {showForm && (
        <Card className="animate-fadeIn border border-[rgba(99,102,241,0.4)] p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg">Yeni Staj Ekle</CardTitle>
            <CardDescription>Lütfen staj detaylarını giriniz.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Öğrenci Adı Soyadı *</label>
              <input
                type="text"
                value={form.studentName}
                onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Şirket Adı *</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="Örn: TechFirm A.Ş."
                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Başlangıç Tarihi *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Bitiş Tarihi *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleAdd}>Kaydet</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>İptal</Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: stats.total,     color: 'text-white' },
          { label: 'Bekliyor', value: stats.pending,   color: 'text-yellow-400' },
          { label: 'Onaylı',   value: stats.approved,  color: 'text-green-400' },
          { label: 'Tamamlandı', value: stats.completed, color: 'text-blue-400' },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#64748b] mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#2a2a3e] text-[#94a3b8] hover:text-white border border-[#3a3a52]'
              }`}
            >
              {f === 'all' ? 'Tümü' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staj Kayıtları ({filtered.length})</CardTitle>
          <CardDescription>Onay bekleyen ve aktif stajlar</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.2)]">
                {['Öğrenci', 'Şirket', 'Başlangıç', 'Bitiş', 'Durum', 'İşlemler'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-[#64748b] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(99,102,241,0.1)]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-[#64748b]">Kayıt bulunamadı.</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#818cf8]" />
                      <span className="text-white">{i.studentName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 text-[#94a3b8]">
                      <Building2 className="w-4 h-4" /> {i.company}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-[#94a3b8]">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(i.startDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-[#94a3b8]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(i.endDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[i.status].cls}`}>
                      {STATUS_CONFIG[i.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {i.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(i.id)}>Onayla</Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(i.id)}>Reddet</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
