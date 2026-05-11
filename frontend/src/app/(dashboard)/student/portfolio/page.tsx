'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { auth } from '@/lib/auth';
import { userApi, getApiError } from '@/lib/api';
import { Briefcase, Plus, Trash2, ExternalLink, Github, Globe } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string;
  github?: string;
  demo?: string;
}

const INITIAL: Project[] = [
  { id: 1, title: 'EduConnect Platformu', description: 'Next.js + FastAPI + Rust ile geliştirilmiş staj yönetim sistemi.', tech: 'Next.js, FastAPI, Rust, PostgreSQL', github: 'https://github.com' },
];

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tech: '', github: '', demo: '' });

  const user = auth.getUserData();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const res = await userApi.get(`/api/v1/users/${user.user_id}`);
        const userValue = res.data?.value ?? {};
        const savedProjects = userValue.projects ?? INITIAL;
        setProjects(savedProjects);
      } catch (err) {
        toast.error('Profil bilgileri yüklenemedi: ' + getApiError(err));
        setProjects(INITIAL);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const saveProjects = async (updated: Project[]) => {
    if (!user) return;
    try {
      await userApi.patch(`/api/v1/users/${user.user_id}`, {
        value: { projects: updated }
      });
      setProjects(updated);
      return true;
    } catch (err) {
      toast.error('Proje kaydedilemedi: ' + getApiError(err));
      return false;
    }
  };

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error('Proje adı zorunludur.'); return; }
    const newProj = {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      tech: form.tech.trim(),
      github: form.github.trim(),
      demo: form.demo.trim()
    };
    const updated = [...projects, newProj];
    const ok = await saveProjects(updated);
    if (ok) {
      setForm({ title: '', description: '', tech: '', github: '', demo: '' });
      setShowForm(false);
      toast.success('Proje başarıyla eklendi!');
    }
  };

  const handleDelete = async (id: number) => {
    const updated = projects.filter(p => p.id !== id);
    const ok = await saveProjects(updated);
    if (ok) {
      toast.success('Proje silindi.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-[#818cf8]" />
            Projelerim & Portfolyo
          </h1>
          <p className="text-[#64748b] text-sm mt-1">
            {user?.email} · Proje ve çalışmalarınızı sergileyin.
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Proje
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="animate-fadeIn border border-[rgba(99,102,241,0.4)]">
          <CardHeader>
            <CardTitle>Yeni Proje Ekle</CardTitle>
            <CardDescription>Tüm alanlara bilgi girin ve kaydedin.</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Proje Adı *',    key: 'title',       placeholder: 'EduConnect Platformu' },
              { label: 'Teknolojiler',   key: 'tech',        placeholder: 'React, FastAPI, Docker' },
              { label: 'GitHub URL',     key: 'github',      placeholder: 'https://github.com/...' },
              { label: 'Demo URL',       key: 'demo',        placeholder: 'https://demo.example.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-[#64748b] mb-1">{f.label}</label>
                <input
                  type="text"
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#64748b] mb-1">Açıklama</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Projeyi kısaca açıklayın..."
                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#818cf8] transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleAdd}>Kaydet</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>İptal</Button>
          </div>
        </Card>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex justify-center py-16 animate-fadeIn">
          <div className="w-10 h-10 border-4 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-16">
          <Briefcase className="w-12 h-12 text-[#64748b] mx-auto mb-3 opacity-40" />
          <p className="text-[#64748b]">Henüz proje eklenmedi.</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> İlk Projeyi Ekle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Card key={p.id} className="card-hover flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-[#64748b] hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-white text-lg mb-1">{p.title}</h3>
              <p className="text-[#94a3b8] text-sm mb-3 flex-1">{p.description}</p>
              {p.tech && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.tech.split(',').map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] text-xs border border-[#6366f1]/30">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-3 border-t border-[rgba(99,102,241,0.15)]">
                {p.github && (
                  <a href={p.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-white transition-colors">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {p.demo && (
                  <a href={p.demo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-white transition-colors">
                    <Globe className="w-3.5 h-3.5" /> Demo
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
