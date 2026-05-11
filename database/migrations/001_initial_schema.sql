-- ============================================================
-- EduConnect: 001 - Initial Schema
-- Pattern: id (BIGSERIAL), created_at, updated_at, value (JSONB)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN index support

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('supervisor', 'school', 'student', 'business');
CREATE TYPE internship_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
CREATE TYPE file_status AS ENUM ('uploaded', 'analyzing', 'analyzed', 'error');
CREATE TYPE audit_action AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UPLOAD');

-- ============================================================
-- USERS (Supervisor, School Admin, Student, Business)
-- ============================================================
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role       user_role   NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    value      JSONB        NOT NULL DEFAULT '{}'
    -- value: { name, surname, phone, avatar_url, ...role_specific_data }
);

CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_is_active  ON users(is_active);
CREATE INDEX idx_users_value_gin  ON users USING GIN(value);

-- ============================================================
-- CREDENTIALS (passwords stored separately)
-- ============================================================
CREATE TABLE credentials (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value        JSONB NOT NULL DEFAULT '{}'
    -- value: { password_hash, last_login, login_attempts, locked_until }
);

CREATE UNIQUE INDEX idx_credentials_user ON credentials(user_id);

-- ============================================================
-- SCHOOLS (extended profile for school role)
-- ============================================================
CREATE TABLE schools (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { name, address, city, phone, email, logo_url, accreditation, departments }
);

CREATE UNIQUE INDEX idx_schools_user ON schools(user_id);
CREATE INDEX idx_schools_value_gin ON schools USING GIN(value);

-- ============================================================
-- STUDENTS (extended profile for student role)
-- ============================================================
CREATE TABLE students (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id  BIGINT REFERENCES schools(id),
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { student_no, department, year, gpa, skills[], bio, cv_url,
    --          projects[], languages[], certificates[], linkedin_url, github_url }
);

CREATE UNIQUE INDEX idx_students_user       ON students(user_id);
CREATE INDEX idx_students_school     ON students(school_id);
CREATE INDEX idx_students_value_gin  ON students USING GIN(value);

-- ============================================================
-- BUSINESSES (extended profile for business role)
-- ============================================================
CREATE TABLE businesses (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { company_name, sector, city, website, description, logo_url,
    --          employee_count, tax_number, contact_person }
);

CREATE UNIQUE INDEX idx_businesses_user      ON businesses(user_id);
CREATE INDEX idx_businesses_value_gin ON businesses USING GIN(value);

-- ============================================================
-- INTERNSHIP LISTINGS (businesses post openings)
-- ============================================================
CREATE TABLE internship_listings (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    value       JSONB NOT NULL DEFAULT '{}'
    -- value: { title, description, required_skills[], department, duration_weeks,
    --          location, remote_allowed, quota, deadline, salary }
);

CREATE INDEX idx_listings_business   ON internship_listings(business_id);
CREATE INDEX idx_listings_is_active  ON internship_listings(is_active);
CREATE INDEX idx_listings_value_gin  ON internship_listings USING GIN(value);

-- ============================================================
-- INTERNSHIPS (applications & active internships)
-- ============================================================
CREATE TABLE internships (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    listing_id   BIGINT NOT NULL REFERENCES internship_listings(id),
    student_id   BIGINT NOT NULL REFERENCES students(id),
    school_id    BIGINT REFERENCES schools(id),
    status       internship_status NOT NULL DEFAULT 'pending',
    value        JSONB NOT NULL DEFAULT '{}'
    -- value: { start_date, end_date, evaluation_score, evaluation_notes,
    --          school_approved, business_approved, documents[] }
);

CREATE INDEX idx_internships_listing ON internships(listing_id);
CREATE INDEX idx_internships_student ON internships(student_id);
CREATE INDEX idx_internships_school  ON internships(school_id);
CREATE INDEX idx_internships_status  ON internships(status);
CREATE INDEX idx_internships_value   ON internships USING GIN(value);

-- ============================================================
-- FILES (uploaded documents)
-- ============================================================
CREATE TABLE files (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     file_status NOT NULL DEFAULT 'uploaded',
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { original_name, stored_name, path, mime_type, size_bytes,
    --          extension, entity_type, entity_id, ai_result, converted_html }
);

CREATE INDEX idx_files_user       ON files(user_id);
CREATE INDEX idx_files_status     ON files(status);
CREATE INDEX idx_files_value_gin  ON files USING GIN(value);

-- ============================================================
-- AUDIT LOGS (all operations logged)
-- ============================================================
CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { user_id, action, entity, entity_id, old_value, new_value,
    --          ip_address, user_agent, service_name, success, error_message }
);

CREATE INDEX idx_audit_created    ON audit_logs(created_at);
CREATE INDEX idx_audit_value_gin  ON audit_logs USING GIN(value);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    value      JSONB NOT NULL DEFAULT '{}'
    -- value: { title, message, type, link, icon }
);

CREATE INDEX idx_notifs_user    ON notifications(user_id);
CREATE INDEX idx_notifs_is_read ON notifications(is_read);
