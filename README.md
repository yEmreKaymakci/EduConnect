# 🎓 EduConnect — Stajyer Yönetim ve Kariyer Platformu

Okulların stajyerlerini yönettiği, öğrencilerin yeteneklerini sergilediği ve işletmelerin kendilerine en uygun stajyeri/yeni mezunu aradığı **yapay zeka destekli**, **mikroservis mimarisine** sahip platform.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows)
- Git

### Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/KULLANICI_ADI/educonnect.git
cd educonnect

# 2. .env dosyasını oluştur
cp .env.example .env
# .env dosyasını aç ve değerleri doldur (Gemini API key dahil)

# 3. Sistemi başlat
docker-compose up -d --build

# 4. Logları takip et
docker-compose logs -f
```

### Servis URL'leri (başlangıç sonrası)

| Servis | URL |
|--------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 🔐 Auth API | http://localhost:8001/docs |
| 👤 User API | http://localhost:8002/docs |
| 📁 File API | http://localhost:8003/docs |
| 🤖 AI API | http://localhost:8004/docs |
| 📊 Log Service | http://localhost:8005/health |
| 🔔 Notifications | ws://localhost:8006/ws |
| 🐰 RabbitMQ UI | http://localhost:15672 |
| 🗄️ PgAdmin | http://localhost:5050 |

### Varsayılan Giriş Bilgileri (Seed Data)

| Rol | Email | Şifre |
|-----|-------|-------|
| Supervisor | supervisor@educonnect.local | Admin@123 |
| Okul | okul@munivers.edu.tr | Admin@123 |
| Öğrenci | ahmet@student.edu.tr | Admin@123 |
| İşletme | ik@techfirm.com | Admin@123 |

## 🏗️ Mimari

```
┌─────────────┐     ┌──────────────────────────────────────┐
│  Next.js 16  │────▶│          API Gateway / BFF            │
│  (Frontend)  │     └──────┬──────┬──────┬────────┘
└─────────────┘             │      │      │
                    ┌───────┘  ┌───┘  ┌──┘
                    ▼          ▼      ▼
              ┌──────────┐ ┌──────┐ ┌──────┐ ┌──────────┐
              │   Auth   │ │ User │ │ File │ │    AI    │
              │  FastAPI │ │ Fast │ │ Fast │ │  FastAPI │
              │  :8001   │ │ :8002│ │ :8003│ │  :8004   │
              └────┬─────┘ └──┬───┘ └──┬───┘ └────┬─────┘
                   └──────────┴────────┴────────────┘
                                  │
                         ┌────────▼────────┐
                         │    RabbitMQ     │
                         └───────┬─────────┘
                     ┌───────────┴───────────┐
                     ▼                       ▼
              ┌─────────────┐       ┌──────────────────┐
              │ Log Service │       │ Notification Svc │
              │ (ExpressJS) │       │   (GoLang RPC)   │
              └──────┬──────┘       └────────┬─────────┘
                     └────────────┬───────────┘
                          ┌───────▼───────┐
                          │  PostgreSQL   │
                          │    + Redis    │
                          └───────────────┘
```

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16 + TailwindCSS + GrapesJS |
| Auth/User/File/AI | FastAPI (Python 3.12) |
| Log Consumer | ExpressJS (Node.js 20) |
| Notification RPC | GoLang 1.23 |
| Message Broker | RabbitMQ 3.13 |
| Primary DB | PostgreSQL 16 (JSONB) |
| Cache/Session | Redis 7 |
| AI/LLM | Google Gemini 1.5 Pro |
| Container | Docker + Docker Compose |
| HTML Editor | GrapesJS |

## 🔑 Önemli Özellikler

- **Dinamik İzin Sistemi**: Supervisor drag&drop ile ekranları ve CRUD izinlerini rollere atar
- **Dosya Kısıtlama**: txt, png, jpg, jpeg, pdf, docx, xlsx — per-role kısıtlama
- **RabbitMQ RPC**: Tüm işlemler kuyruğa publish edilir, consumer'lar RPC ile sonuç bildirir
- **PostgreSQL Triggers**: updated_at otomasyonu, audit log, pg_notify
- **AI Dosya Analizi**: TXT prompt işleme, Word→HTML dönüşümü (Gemini ile)
- **GrapesJS Editör**: Dönüştürülen HTML'yi tarayıcıda düzenleme
- **RAG Arama**: Doğal dil ile öğrenci profili arama

## 📁 Proje Yapısı

```
EduConnect/
├── docker-compose.yml
├── .env.example          # Bunu kopyalayıp .env yapın
├── rabbitmq/             # RabbitMQ yapılandırması
├── database/
│   ├── migrations/       # PostgreSQL migration SQL dosyaları
│   └── seeds/            # Örnek veriler
├── services/
│   ├── auth-service/     # FastAPI :8001
│   ├── user-service/     # FastAPI :8002
│   ├── file-service/     # FastAPI :8003
│   ├── ai-service/       # FastAPI :8004 (Gemini)
│   ├── log-service/      # ExpressJS :8005
│   └── notification-service/ # GoLang :8006
└── frontend/             # Next.js 16
```

## 🧪 Test

```bash
# Tüm servislerin sağlık durumunu kontrol et
docker-compose ps
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health

# Auth testi
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supervisor@educonnect.local","password":"Admin@123"}'
```

## 👥 Geliştirici

| Ad | Rol |
|----|-----|
| [İsim] | Backend / Auth Service |
| [İsim] | Frontend / AI Service |
| [İsim] | DevOps / Log & Notification |

---
*EduConnect — Final Projesi 2024*
