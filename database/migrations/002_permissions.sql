-- ============================================================
-- EduConnect: 002 - Permission System
-- Supervisor'ın rollere ekran ve CRUD izni ataması
-- ============================================================

-- ============================================================
-- SCREENS (mevcut tüm uygulama ekranları)
-- ============================================================
CREATE TABLE screens (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { name, display_name, description, icon, category }
);

INSERT INTO screens(value) VALUES
    ('{"name":"dashboard",           "display_name":"Ana Sayfa",              "category":"general",    "icon":"LayoutDashboard"}'),
    ('{"name":"student_list",        "display_name":"Öğrenci Listesi",         "category":"student",    "icon":"Users"}'),
    ('{"name":"student_profile",     "display_name":"Öğrenci Profili",         "category":"student",    "icon":"User"}'),
    ('{"name":"cv_builder",          "display_name":"CV Oluşturucu",           "category":"student",    "icon":"FileText"}'),
    ('{"name":"portfolio",           "display_name":"Proje Portföyü",          "category":"student",    "icon":"Briefcase"}'),
    ('{"name":"internship_listings", "display_name":"Staj İlanları",           "category":"internship", "icon":"ListChecks"}'),
    ('{"name":"internship_apply",    "display_name":"Staj Başvurusu",          "category":"internship", "icon":"Send"}'),
    ('{"name":"internship_manage",   "display_name":"Staj Yönetimi",           "category":"internship", "icon":"Settings2"}'),
    ('{"name":"internship_evaluate", "display_name":"Stajyer Değerlendirme",   "category":"internship", "icon":"Star"}'),
    ('{"name":"business_search",     "display_name":"İşletme Arama",           "category":"business",   "icon":"Search"}'),
    ('{"name":"school_reports",      "display_name":"Okul Raporları",          "category":"school",     "icon":"BarChart2"}'),
    ('{"name":"file_upload",         "display_name":"Dosya Yükleme",           "category":"files",      "icon":"Upload"}'),
    ('{"name":"file_manager",        "display_name":"Dosya Yöneticisi",        "category":"files",      "icon":"FolderOpen"}'),
    ('{"name":"ai_assistant",        "display_name":"YZ Asistanı",             "category":"ai",         "icon":"Bot"}'),
    ('{"name":"ai_file_analyzer",    "display_name":"YZ Dosya Analizörü",      "category":"ai",         "icon":"Cpu"}'),
    ('{"name":"html_editor",         "display_name":"HTML Düzenleyici",        "category":"ai",         "icon":"Code2"}'),
    ('{"name":"user_management",     "display_name":"Kullanıcı Yönetimi",      "category":"admin",      "icon":"UserCog"}'),
    ('{"name":"permission_manager",  "display_name":"İzin Yönetimi",           "category":"admin",      "icon":"Shield"}'),
    ('{"name":"system_logs",         "display_name":"Sistem Logları",          "category":"admin",      "icon":"ScrollText"}'),
    ('{"name":"notifications",       "display_name":"Bildirimler",             "category":"general",    "icon":"Bell"}');

-- ============================================================
-- ROLE_SCREEN_ASSIGNMENTS (Supervisor hangi ekranı hangi role atar)
-- ============================================================
CREATE TABLE role_screen_assignments (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role       user_role NOT NULL,
    screen_id  BIGINT NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { can_create, can_read, can_update, can_delete, assigned_by_user_id }
);

CREATE UNIQUE INDEX idx_role_screen_unique ON role_screen_assignments(role, screen_id);

-- ============================================================
-- FILE_TYPE_RESTRICTIONS (Supervisor dosya tipi kısıtlaması)
-- ============================================================
CREATE TABLE file_type_restrictions (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role       user_role NOT NULL UNIQUE,
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { allowed_extensions: ["pdf","docx","jpg","jpeg","png","txt","xlsx"] }
);

INSERT INTO file_type_restrictions(role, value) VALUES
    ('supervisor', '{"allowed_extensions": ["txt","png","jpg","jpeg","pdf","docx","xlsx"]}'),
    ('school',     '{"allowed_extensions": ["txt","png","jpg","jpeg","pdf","docx","xlsx"]}'),
    ('student',    '{"allowed_extensions": ["pdf","docx","jpg","jpeg","png"]}'),
    ('business',   '{"allowed_extensions": ["pdf","jpg","jpeg","png"]}');

-- ============================================================
-- DEFAULT SCREEN ASSIGNMENTS (initial defaults by role)
-- ============================================================

-- Supervisor: all screens
INSERT INTO role_screen_assignments(role, screen_id, value)
SELECT 'supervisor', id,
       '{"can_create":true,"can_read":true,"can_update":true,"can_delete":true,"assigned_by_user_id":null}'::JSONB
FROM screens;

-- Student: their own screens
INSERT INTO role_screen_assignments(role, screen_id, value)
SELECT 'student', id,
       '{"can_create":true,"can_read":true,"can_update":true,"can_delete":false,"assigned_by_user_id":null}'::JSONB
FROM screens
WHERE value->>'name' IN ('dashboard','cv_builder','portfolio','internship_listings',
                          'internship_apply','file_upload','ai_assistant','notifications','student_profile');

-- School: school screens
INSERT INTO role_screen_assignments(role, screen_id, value)
SELECT 'school', id,
       '{"can_create":false,"can_read":true,"can_update":false,"can_delete":false,"assigned_by_user_id":null}'::JSONB
FROM screens
WHERE value->>'name' IN ('dashboard','student_list','student_profile','internship_manage',
                          'school_reports','file_manager','notifications');

-- Business: business screens
INSERT INTO role_screen_assignments(role, screen_id, value)
SELECT 'business', id,
       '{"can_create":false,"can_read":true,"can_update":false,"can_delete":false,"assigned_by_user_id":null}'::JSONB
FROM screens
WHERE value->>'name' IN ('dashboard','student_list','internship_listings',
                          'internship_evaluate','business_search','notifications');
