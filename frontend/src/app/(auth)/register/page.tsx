'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi, getApiError } from '@/lib/api';
import { toast } from 'react-hot-toast';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams?.get('role') || 'student';

  const [formData, setFormData] = useState({
    role: defaultRole,
    name: '',
    surname: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.post('/api/v1/auth/register', formData);
      toast.success('Kayıt başarılı! Lütfen giriş yapın.');
      router.push(`/login?role=${formData.role}`);
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputCls = "w-full px-4 py-2 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white focus:outline-none focus:border-[#818cf8] transition-colors";
  const labelCls = "block text-xs font-medium text-[#64748b] mb-1";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 max-w-md w-full animate-fadeIn relative overflow-hidden" suppressHydrationWarning>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9] rounded-full blur-[80px] opacity-20 pointer-events-none" suppressHydrationWarning />

        <div className="text-center mb-6 relative z-10" suppressHydrationWarning>
          <Link href="/" className="inline-block text-3xl mb-2 hover:scale-110 transition-transform">🎓</Link>
          <h1 className="text-2xl font-bold text-white mb-1">Hesap Oluştur</h1>
          <p className="text-[#94a3b8] text-sm">EduConnect platformuna katılın</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 relative z-10" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <label className={labelCls}>Rol</label>
            <select name="role" value={formData.role} onChange={handleChange} className={inputCls} suppressHydrationWarning>
              <option value="student">Öğrenci</option>
              <option value="school">Okul Yetkilisi</option>
              <option value="business">İşletme Yetkilisi</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <label className={labelCls}>Ad</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} suppressHydrationWarning />
            </div>
            <div suppressHydrationWarning>
              <label className={labelCls}>Soyad</label>
              <input type="text" name="surname" value={formData.surname} onChange={handleChange} required className={inputCls} suppressHydrationWarning />
            </div>
          </div>

          <div suppressHydrationWarning>
            <label className={labelCls}>E-posta</label>
            <input type="text" name="email" value={formData.email} onChange={handleChange} required placeholder="ornek@domain.com" className={inputCls} suppressHydrationWarning />
          </div>

          <div suppressHydrationWarning>
            <label className={labelCls}>Telefon (Opsiyonel)</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} suppressHydrationWarning />
          </div>

          <div suppressHydrationWarning>
            <label className={labelCls}>Şifre (min. 8 karakter)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className={inputCls} suppressHydrationWarning />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-11 rounded-lg font-semibold text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {isLoading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-[#94a3b8] relative z-10">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-[#818cf8] hover:text-white transition-colors">
            Giriş Yap
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
