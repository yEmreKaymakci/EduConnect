import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="glass p-12 max-w-2xl w-full text-center animate-fadeIn">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-DEFAULT to-accent-DEFAULT flex items-center justify-center text-4xl glow">
            🎓
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary-light to-accent-DEFAULT bg-clip-text text-transparent">
          EduConnect
        </h1>
        <p className="text-text-secondary mb-2 text-lg">
          Stajyer Yönetim ve Kariyer Platformu
        </p>
        <p className="text-text-muted text-sm mb-10">
          Öğrencileri, Okulları ve İşletmeleri buluşturan yapay zeka destekli platform
        </p>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { role: 'student',    emoji: '🎒', title: 'Öğrenci',   desc: 'CV oluştur, staj başvur',      color: 'from-blue-500 to-indigo-600' },
            { role: 'school',     emoji: '🏫', title: 'Okul',      desc: 'Stajyerleri yönet, raporla',   color: 'from-green-500 to-teal-600' },
            { role: 'business',   emoji: '🏢', title: 'İşletme',   desc: 'Stajyer ara, değerlendir',     color: 'from-orange-500 to-red-600' },
            { role: 'supervisor', emoji: '⚙️', title: 'Supervisor', desc: 'Tüm sistemi yönet',           color: 'from-purple-500 to-pink-600' },
          ].map((item) => (
            <Link
              key={item.role}
              href={`/login?role=${item.role}`}
              className={`group p-5 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-10 border border-white/10 hover:border-white/30 transition-all duration-200 hover:scale-105 hover:shadow-xl`}
            >
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="font-semibold text-white">{item.title}</div>
              <div className="text-xs text-white/70 mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>

        <Link href="/login" className="btn-primary inline-block w-full">
          Giriş Yap
        </Link>
        <p className="text-text-muted text-xs mt-4">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-primary-light hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </main>
  )
}
