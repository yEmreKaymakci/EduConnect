'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { auth } from '@/lib/auth';
import { Briefcase, Plus, Calendar, Users, Clock, X, MapPin } from 'lucide-react';

interface Listing {
  id: number;
  title: string;
  department: string;
  location: string;
  startDate: string;
  duration: string;
  quota: number;
  applicants: number;
  status: 'active' | 'closed' | 'draft';
}

const STATUS_CONFIG = {
  active: { label: 'Aktif',   cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  closed: { label: 'Kapalı',  cls: 'bg-red-500/15   text-red-400   border-red-500/30' },
  draft:  { label: 'Taslak',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
};

const MOCK: Listing[] = [
  { id: 1, title: 'Frontend Geliştirici Stajyeri', department: 'Yazılım', location: 'İstanbul / Uzak', startDate: '2026-06-01', duration: '3 ay', quota: 2, applicants: 8, status: 'active' },
  { id: 2, title: 'Veri Analizi Stajyeri',         department: 'Analitik', location: 'Ankara', startDate: '2026-07-01', duration: '2 ay', quota: 1, applicants: 3, status: 'active' },
  { id: 3, title: 'UI/UX Tasarım Stajyeri',        department: 'Tasarım', location: 'İzmir', startDate: '2025-06-01', duration: '3 ay', quota: 1, applicants: 12, status: 'closed' },
];

const EMPTY_FORM = { title: '', department: '', location: '', startDate: '', duration: '', quota: 1 };

export default function BusinessListingsPage() {
  const [listings, setListings] = useState<Listing[]>(MOCK);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);

  const handlePublish = () => {
    if (!form.title.trim()) { toast.error('İlan başlığı zorunludur.'); return; }
    const newListing: Listing = {
      ...form,
      id: Date.now(),
      applicants: 0,
      status: 'active',
    };
    setListings(prev => [newListing, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success('İlan yayımlandı!');
  };

  const handleClose = (id: number) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'closed' } : l));
    toast.success('İlan kapatıldı.');
  };

  const handleDelete = (id: number) => {
    setListings(prev => prev.filter(l => l.id !== id));
    toast.success('İlan silindi.');
  };

  const user = auth.getUserData();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-[#818cf8]" />
            Staj İlanlarım
          </h1>
          <p className="text-[#64748b] text-sm mt-1">
            {user?.email} · Yayımladığınız staj ilanlarını yönetin.
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4 mr-2" /> Yeni İlan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam İlan',  value: listings.length,                          color: 'text-white' },
          { label: 'Aktif',        value: listings.filter(l => l.status === 'active').length, color: 'text-green-400' },
          { label: 'Toplam Başvuru', value: listings.reduce((a, l) => a + l.applicants, 0), color: 'text-[#818cf8]' },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#64748b] mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* New listing form */}
      {showForm && (
        <Card className="animate-fadeIn border border-[rgba(99,102,241,0.4)]">
          <CardHeader>
            <CardTitle>Yeni Staj İlanı Oluştur</CardTitle>
            <CardDescription>İlanınız onaylandıktan sonra öğrencilere görünecektir.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { label: 'İlan Başlığı *', key: 'title',      placeholder: 'Frontend Stajyeri' },
              { label: 'Departman',      key: 'department', placeholder: 'Yazılım Geliştirme' },
              { label: 'Konum',          key: 'location',   placeholder: 'İstanbul / Uzak' },
              { label: 'Başlangıç Tarihi', key: 'startDate', placeholder: '2026-06-01', type: 'date' },
              { label: 'Süre',           key: 'duration',   placeholder: '3 ay' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-[#64748b] mb-1">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Kontenjan</label>
              <input
                type="number"
                min={1}
                value={form.quota}
                onChange={e => setForm(p => ({ ...p, quota: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handlePublish}>Yayımla</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>İptal</Button>
          </div>
        </Card>
      )}

      {/* Listings */}
      <div className="space-y-4">
        {listings.length === 0 ? (
          <Card className="text-center py-16">
            <Briefcase className="w-12 h-12 text-[#64748b] mx-auto mb-3 opacity-30" />
            <p className="text-[#64748b] mb-4">Henüz ilan yayımlanmamış.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> İlk İlanı Oluştur
            </Button>
          </Card>
        ) : listings.map(listing => (
          <Card key={listing.id} className="card-hover">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-white text-lg">{listing.title}</h3>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[listing.status].cls}`}>
                      {STATUS_CONFIG[listing.status].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#94a3b8]">
                    <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{listing.department}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{listing.location}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(listing.startDate).toLocaleDateString('tr-TR')}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{listing.duration}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{listing.applicants} başvuru</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {listing.status === 'active' && (
                  <Button size="sm" variant="danger" onClick={() => handleClose(listing.id)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Kapat
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(listing.id)}>
                  Sil
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
