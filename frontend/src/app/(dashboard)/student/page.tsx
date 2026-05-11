'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Briefcase, FileText, Send, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Kariyer Özeti</h2>
          <p className="text-text-muted text-sm">Profil durumunuz ve başvurularınız</p>
        </div>
        <Link href="/student/cv">
          <Button>CV'ni Güncelle</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Aktif Başvurular', value: '3', icon: Send, color: 'text-blue-400' },
          { title: 'Profil Görüntülenmesi', value: '24', icon: Star, color: 'text-yellow-400' },
          { title: 'Yetenek Eşleşmesi', value: '%85', icon: Briefcase, color: 'text-green-400' },
          { title: 'Sistem Skoru', value: '92/100', icon: FileText, color: 'text-purple-400' },
        ].map((stat, i) => (
          <Card key={i} className="hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl bg-surface-border/50 ${stat.color}`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-text-muted font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Yapay Zeka Önerileri</CardTitle>
            <CardDescription>Profilinizi geliştirmek için Gemini tavsiyeleri</CardDescription>
          </CardHeader>
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-medium text-primary-light mb-1">Yeni Yetenek Ekleme Önerisi</h4>
              <p className="text-sm text-white/80">İlanlara baktığımızda "Docker" ve "RabbitMQ" aranan popüler yetenekler. CV'nize bunları ekleyerek görünürlüğünüzü %30 artırabilirsiniz.</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-border/50 border border-surface-border">
              <h4 className="font-medium text-white mb-1">Portfolyo Zayıf</h4>
              <p className="text-sm text-white/70">Github linkinizi eklediniz ancak projelerin detaylı açıklaması eksik. YZ Asistanını kullanarak repo linkinizden otomatik proje özeti oluşturun.</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Başvurular</CardTitle>
            <CardDescription>Staj başvurularınızın güncel durumu</CardDescription>
          </CardHeader>
          <div className="mt-4 space-y-3">
            {[
              { firm: "TechFirm A.Ş.", role: "Backend Developer Stajyeri", status: "Değerlendirmede", color: "text-yellow-400" },
              { firm: "Innova", role: "Frontend Stajyeri", status: "Onaylandı", color: "text-green-400" },
              { firm: "Startup X", role: "Fullstack Stajyeri", status: "Reddedildi", color: "text-red-400" },
            ].map((app, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-surface-border">
                <div>
                  <p className="font-medium text-white">{app.firm}</p>
                  <p className="text-xs text-text-muted">{app.role}</p>
                </div>
                <span className={`text-sm font-medium ${app.color}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
