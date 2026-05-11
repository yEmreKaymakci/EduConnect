-- ============================================================
-- EduConnect: Seed Data (development only)
-- Default password for ALL test accounts: Admin@123
-- Hash verified with: bcrypt.checkpw(b'Admin@123', hash) => True
-- ============================================================

-- Supervisor user
INSERT INTO users(role, email, is_active, value) VALUES
    ('supervisor', 'supervisor@educonnect.local', TRUE,
     '{"name":"Super","surname":"Admin","phone":"+90 555 000 0001","avatar_url":null}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO credentials(user_id, value)
SELECT id, '{"password_hash":"$2b$12$lltnzv/N.lZUyT/BJEBpJe4Hn4P9/zdGsqp3Ytfo8J1Ztwrnovwi6","login_attempts":0}'
FROM users WHERE email = 'supervisor@educonnect.local'
ON CONFLICT (user_id) DO UPDATE SET value = EXCLUDED.value;

-- Sample School
INSERT INTO users(role, email, is_active, value) VALUES
    ('school', 'okul@munivers.edu.tr', TRUE,
     '{"name":"Mert","surname":"Yılmaz","phone":"+90 555 000 0002","avatar_url":null}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO credentials(user_id, value)
SELECT id, '{"password_hash":"$2b$12$lltnzv/N.lZUyT/BJEBpJe4Hn4P9/zdGsqp3Ytfo8J1Ztwrnovwi6","login_attempts":0}'
FROM users WHERE email = 'okul@munivers.edu.tr'
ON CONFLICT (user_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO schools(user_id, value)
SELECT id, '{"name":"Marmara Üniversitesi","address":"Göztepe","city":"İstanbul","phone":"+90 216 000 0000","email":"info@munivers.edu.tr","logo_url":null,"departments":["Bilgisayar Mühendisliği","Yazılım Mühendisliği","Elektrik Mühendisliği"]}'
FROM users WHERE email = 'okul@munivers.edu.tr'
ON CONFLICT (user_id) DO NOTHING;

-- Sample Student
INSERT INTO users(role, email, is_active, value) VALUES
    ('student', 'ahmet@student.edu.tr', TRUE,
     '{"name":"Ahmet","surname":"Kaya","phone":"+90 555 000 0003","avatar_url":null}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO credentials(user_id, value)
SELECT id, '{"password_hash":"$2b$12$lltnzv/N.lZUyT/BJEBpJe4Hn4P9/zdGsqp3Ytfo8J1Ztwrnovwi6","login_attempts":0}'
FROM users WHERE email = 'ahmet@student.edu.tr'
ON CONFLICT (user_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO students(user_id, school_id, value)
SELECT
    u.id,
    s.id,
    '{"student_no":"20200001","department":"Bilgisayar Mühendisliği","year":3,"gpa":3.2,"skills":["Python","FastAPI","React","PostgreSQL"],"bio":"Yazılım geliştirmeye tutkulu bir öğrenci","projects":[{"name":"EduConnect","description":"Staj yönetim sistemi","url":"https://github.com/ahmet/educonnect"}],"languages":["Türkçe","İngilizce"],"certificates":[],"linkedin_url":"","github_url":"https://github.com/ahmetkaya"}'
FROM users u, schools s
WHERE u.email = 'ahmet@student.edu.tr'
AND s.value->>'name' = 'Marmara Üniversitesi'
ON CONFLICT (user_id) DO NOTHING;

-- Sample Business
INSERT INTO users(role, email, is_active, value) VALUES
    ('business', 'ik@techfirm.com', TRUE,
     '{"name":"Ayşe","surname":"Demir","phone":"+90 555 000 0004","avatar_url":null}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO credentials(user_id, value)
SELECT id, '{"password_hash":"$2b$12$lltnzv/N.lZUyT/BJEBpJe4Hn4P9/zdGsqp3Ytfo8J1Ztwrnovwi6","login_attempts":0}'
FROM users WHERE email = 'ik@techfirm.com'
ON CONFLICT (user_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO businesses(user_id, value)
SELECT id, '{"company_name":"TechFirm A.Ş.","sector":"Yazılım","city":"İstanbul","website":"https://techfirm.com","description":"Kurumsal yazılım çözümleri","logo_url":null,"employee_count":150,"contact_person":"Ayşe Demir"}'
FROM users WHERE email = 'ik@techfirm.com'
ON CONFLICT (user_id) DO NOTHING;

-- Sample Internship Listing
INSERT INTO internship_listings(business_id, is_active, value)
SELECT b.id, TRUE,
    '{"title":"Backend Stajyeri (Python/FastAPI)","description":"FastAPI ile mikroservis geliştirme deneyimi kazanacaksınız","required_skills":["Python","FastAPI","PostgreSQL"],"department":"Yazılım","duration_weeks":8,"location":"İstanbul","remote_allowed":true,"quota":2,"deadline":"2025-08-01","salary":5000}'
FROM businesses b
JOIN users u ON u.id = b.user_id
WHERE u.email = 'ik@techfirm.com';
