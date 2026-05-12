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
## 📸 Proje Görselleri
<br /><br />
### 👥 Öğrenci Sayfaları
<br />
<p><strong>Dashboard</strong></p>
<img width="1917" height="868" alt="StudentDashboard" src="https://github.com/user-attachments/assets/673b983e-f677-47b0-9ee2-c7a0d2af3d37" />
<br />

<p><strong>CV Analizi</strong></p>
<img width="1918" height="913" alt="StudentCv" src="https://github.com/user-attachments/assets/a2c9ae37-1a88-4f38-bc67-6eaadb5e5104" />
<br />

<p><strong>Dosya Dönüştürme</strong></p>
<img width="1918" height="908" alt="student_ai_files" src="https://github.com/user-attachments/assets/e4eb4577-b0ef-4064-b138-67aec30052ca" />
<br />

<p><strong>YZ Asistanı</strong></p>
<img width="1918" height="892" alt="StudentAIAssistant" src="https://github.com/user-attachments/assets/e1e5dcda-67b3-40fe-907b-febc35b54a87" />
<br />

<p><strong>Projeler</strong></p>
<img width="1918" height="877" alt="StudentPortfolio" src="https://github.com/user-attachments/assets/e4bbf207-5eaf-4b11-9166-59ecdb8d4faf" />
<br />

### 👥 Okul Yönetimi Sayfaları

<p><strong>Dashboard</strong></p>
<img width="1918" height="880" alt="SchoolDashboard" src="https://github.com/user-attachments/assets/8b3b9233-86fb-4d2f-8d17-14b40f2d9264" />
<br />

<p><strong>Öğrenciler</strong></p>
<img width="1918" height="863" alt="SchoolStudents" src="https://github.com/user-attachments/assets/f6da8680-b3a1-4591-8330-0b7fa1349e4e" />
<br />

<p><strong>Stajlar</strong></p>
<img width="1918" height="875" alt="School_Internships" src="https://github.com/user-attachments/assets/6a97ecb0-3866-4a75-870e-4aa116538bf8" />
<br /><br />



### 👥 İşletme Yönetimi Sayfaları
<br />
<p><strong>Dashboard</strong></p>
<img width="1918" height="885" alt="BusinessDashboard" src="https://github.com/user-attachments/assets/ac51dec1-bc36-4f15-9d7d-317e529dbfb6" />
<br />

<p><strong>Stajyer Arama</strong></p>
<img width="1918" height="886" alt="Business_InternSearch" src="https://github.com/user-attachments/assets/44b7115f-602d-4407-aa3a-0bfe3e2b943a" />
<br />

<p><strong>Staj İlanlarım</strong></p>
<img width="1918" height="878" alt="BusinessListings" src="https://github.com/user-attachments/assets/d356eeff-902d-4104-a809-9aba616a0801" />
<br /><br />


### 👥 Supervisor Sayfaları
<br />
<p><strong>Dashboard</strong></p>
<img width="1918" height="1078" alt="Supervisor_Dashboard" src="https://github.com/user-attachments/assets/92a38482-711d-46a1-9136-1a9cf5301852" />
<br />

<p><strong>İzin Yönetimi</strong></p>
<img width="1917" height="932" alt="Supervisor_İzinYonetimi" src="https://github.com/user-attachments/assets/c1984006-3ef5-4e54-ae65-faa65215f719" />
<br />

<p><strong>Kullanıcı Yönetimi</strong></p>
<img width="1918" height="971" alt="Supervisor_Kullanıcı_Yonetimi" src="https://github.com/user-attachments/assets/1aa347c9-2a8c-4a6f-97c6-00ff4c6fd7ec" />
<br />

*EduConnect*
