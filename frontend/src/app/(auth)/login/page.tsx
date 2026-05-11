'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi, getApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'react-hot-toast';

// LoginForm ayrı bileşen — useSearchParams hook'u için Suspense boundary gerektirir
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams?.get('role');

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await authApi.post('/api/v1/auth/login', { email, password });

      auth.setToken(data.access_token, (data.expires_in ?? 3600) * 1000);
      auth.setUserData({
        user_id: data.user_id,
        role:    data.role,
        email:   data.email,
      });

      toast.success('Başarıyla giriş yapıldı!');
      router.push(`/${data.role}`);
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // suppressHydrationWarning → browser uzantılarının (bis_skin_checked vb.)
    // enjekte ettiği attribute'lar bu ağaçta hydration uyarısı vermez
    <main className="min-h-screen flex items-center justify-center p-4" suppressHydrationWarning>
      <div
        className="glass p-8 max-w-md w-full animate-fadeIn relative overflow-hidden"
        suppressHydrationWarning
      >
        {/* Arka plan parlaması */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-[80px] opacity-30 pointer-events-none"
          style={{ background: '#6366f1' }}
          suppressHydrationWarning
        />

        {/* Başlık */}
        <div className="text-center mb-8 relative z-10" suppressHydrationWarning>
          <Link href="/" className="inline-block text-4xl mb-4 hover:scale-110 transition-transform">
            🎓
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h1>
          <p className="text-[#94a3b8] text-sm">Hesabınıza giriş yaparak platforma erişin</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10" suppressHydrationWarning>
          {/* E-posta */}
          <div suppressHydrationWarning>
            <label className="block text-sm font-medium text-[#64748b] mb-1">E-posta</label>
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white focus:outline-none focus:border-[#818cf8] transition-colors placeholder:text-[#475569]"
              placeholder="supervisor@educonnect.local"
              required
            />
          </div>

          {/* Şifre */}
          <div suppressHydrationWarning>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Şifre</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a3e] border border-[#3a3a52] rounded-lg text-white focus:outline-none focus:border-[#818cf8] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 h-12 rounded-lg font-semibold text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Giriş Yap'}
          </button>
        </form>

        {/* Alt link */}
        <p className="text-center mt-6 text-sm text-[#94a3b8] relative z-10">
          Henüz hesabınız yok mu?{' '}
          <Link
            href={defaultRole ? `/register?role=${defaultRole}` : '/register'}
            className="text-[#818cf8] hover:text-white transition-colors"
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
