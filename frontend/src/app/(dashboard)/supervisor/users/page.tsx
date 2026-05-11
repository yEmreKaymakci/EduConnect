'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi, getApiError } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  Users, Search, RefreshCw, Trash2, UserCheck,
  UserX, Mail, Calendar, Shield,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface UserRecord {
  id:         number;
  email:      string;
  name:       string;
  surname:    string;
  role:       string;
  is_active:  boolean;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  supervisor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  student:    'bg-blue-500/20   text-blue-300   border-blue-500/40',
  school:     'bg-green-500/20  text-green-300  border-green-500/40',
  business:   'bg-orange-500/20 text-orange-300 border-orange-500/40',
};

const ROLE_LABELS: Record<string, string> = {
  supervisor: 'Supervisor',
  student:    'Öğrenci',
  school:     'Okul',
  business:   'İşletme',
};

// ── Component ─────────────────────────────────────────────────
export default function UsersPage() {
  const [users,      setUsers]      = useState<UserRecord[]>([]);
  const [filtered,   setFiltered]   = useState<UserRecord[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processing, setProcessing] = useState<number | null>(null);

  // ── Fetch users ─────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userApi.get('/api/v1/users/');
      setUsers(res.data.users ?? res.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filter ───────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u => {
        const matchRole   = roleFilter === 'all' || u.role === roleFilter;
        const matchSearch = !q
          || u.email.toLowerCase().includes(q)
          || u.name.toLowerCase().includes(q)
          || u.surname.toLowerCase().includes(q);
        return matchRole && matchSearch;
      })
    );
  }, [users, search, roleFilter]);

  // ── Toggle active ─────────────────────────────────────────────
  const handleToggleActive = async (user: UserRecord) => {
    setProcessing(user.id);
    try {
      await userApi.patch(`/api/v1/users/${user.id}`, { is_active: !user.is_active });
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      );
      toast.success(user.is_active ? 'Kullanıcı pasif yapıldı.' : 'Kullanıcı aktif edildi.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessing(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`"${user.email}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    setProcessing(user.id);
    try {
      await userApi.delete(`/api/v1/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('Kullanıcı silindi.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessing(null);
    }
  };

  // ── Stats ────────────────────────────────────────────────────
  const stats = {
    total:    users.length,
    active:   users.filter(u => u.is_active).length,
    student:  users.filter(u => u.role === 'student').length,
    business: users.filter(u => u.role === 'business').length,
    school:   users.filter(u => u.role === 'school').length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-[#818cf8]" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-[#64748b] text-sm mt-1">
            Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin.
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          isLoading={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Toplam',   value: stats.total,    color: 'text-white' },
          { label: 'Aktif',    value: stats.active,   color: 'text-green-400' },
          { label: 'Öğrenci', value: stats.student,  color: 'text-blue-400' },
          { label: 'Okul',    value: stats.school,   color: 'text-green-400' },
          { label: 'İşletme', value: stats.business, color: 'text-orange-400' },
        ].map(s => (
          <Card key={s.label} className="py-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#64748b] mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Ad, soyad veya e-posta ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
            />
          </div>
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-[#818cf8] transition-colors"
          >
            <option value="all">Tüm Roller</option>
            <option value="supervisor">Supervisor</option>
            <option value="student">Öğrenci</option>
            <option value="school">Okul</option>
            <option value="business">İşletme</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
          <CardDescription>
            {filtered.length} kullanıcı listeleniyor
            {roleFilter !== 'all' && ` (${ROLE_LABELS[roleFilter] ?? roleFilter})`}
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#64748b]">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.2)]">
                  {['Kullanıcı', 'E-posta', 'Rol', 'Durum', 'Kayıt Tarihi', 'İşlemler'].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-[#64748b] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(99,102,241,0.1)]">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Name */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(user.name?.[0] ?? user.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.name} {user.surname}
                          </p>
                          <p className="text-[10px] text-[#64748b]">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="py-3 px-2">
                      <span className="text-[#94a3b8] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 shrink-0" />
                        {user.email}
                      </span>
                    </td>
                    {/* Role */}
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role] ?? 'bg-white/10 text-white border-white/20'}`}>
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {user.is_active ? (
                          <><UserCheck className="w-3 h-3" /> Aktif</>
                        ) : (
                          <><UserX className="w-3 h-3" /> Pasif</>
                        )}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="py-3 px-2">
                      <span className="text-[#94a3b8] flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3 h-3" />
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('tr-TR')
                          : '—'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-2">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant={user.is_active ? 'danger' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          isLoading={processing === user.id}
                          title={user.is_active ? 'Pasif Yap' : 'Aktif Et'}
                        >
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          isLoading={processing === user.id}
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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
