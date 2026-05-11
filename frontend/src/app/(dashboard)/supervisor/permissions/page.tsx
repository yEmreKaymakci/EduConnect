'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { auth } from '@/lib/auth';

const ROLES = ['student', 'school', 'business'];
const SCREENS = ['dashboard', 'student_list', 'cv_builder', 'portfolio', 'internship_listings', 'file_upload', 'ai_assistant'];

export default function PermissionManager() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [selectedScreen, setSelectedScreen] = useState('dashboard');
  const [permissions, setPermissions] = useState({ can_create: false, can_read: true, can_update: false, can_delete: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    setIsLoading(true);
    try {
      const user = auth.getUserData();
      await userApi.post('/api/v1/users/permissions/assign', {
        role: selectedRole,
        screen_name: selectedScreen,
        ...permissions,
        assigned_by: user?.user_id
      });
      toast.success('İzinler başarıyla atandı!');
    } catch (err) {
      toast.error('İzin atama başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    setIsLoading(true);
    try {
      const user = auth.getUserData();
      await userApi.delete(`/api/v1/users/permissions/revoke?role=${selectedRole}&screen_name=${selectedScreen}&by_user_id=${user?.user_id}`);
      toast.success('İzinler başarıyla kaldırıldı!');
    } catch (err) {
      toast.error('İzin kaldırma başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ekran ve İzin Yönetimi</CardTitle>
          <CardDescription>Rollere göre sayfa erişimlerini ve CRUD yetkilerini belirleyin.</CardDescription>
        </CardHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Rol Seçimi</label>
              <select 
                value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-primary-light"
              >
                {ROLES.map(role => <option key={role} value={role}>{role.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Ekran Seçimi</label>
              <select 
                value={selectedScreen} onChange={(e) => setSelectedScreen(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-primary-light"
              >
                {SCREENS.map(screen => <option key={screen} value={screen}>{screen}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-3">CRUD Yetkileri</label>
            <div className="flex gap-6">
              {[
                { key: 'can_create', label: 'Create (Oluşturma)' },
                { key: 'can_read', label: 'Read (Görüntüleme)' },
                { key: 'can_update', label: 'Update (Güncelleme)' },
                { key: 'can_delete', label: 'Delete (Silme)' },
              ].map(perm => (
                <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={(permissions as any)[perm.key]} 
                    onChange={(e) => setPermissions(p => ({ ...p, [perm.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-border bg-surface text-primary-light focus:ring-primary-light"
                  />
                  <span className="text-white text-sm">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-surface-border">
            <Button onClick={handleAssign} isLoading={isLoading}>İzinleri Ata (Güncelle)</Button>
            <Button onClick={handleRevoke} variant="danger" disabled={isLoading}>Erişimi Kaldır</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
