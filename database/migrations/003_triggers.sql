-- ============================================================
-- EduConnect: 003 - Triggers
-- updated_at otomasyonu + audit loglama + pg_notify
-- ============================================================

-- ============================================================
-- FUNCTION: updated_at otomatik güncelleme
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: users
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: credentials
CREATE TRIGGER trg_credentials_updated_at
    BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: schools
CREATE TRIGGER trg_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: students
CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: businesses
CREATE TRIGGER trg_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: internships
CREATE TRIGGER trg_internships_updated_at
    BEFORE UPDATE ON internships
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: files
CREATE TRIGGER trg_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: role_screen_assignments
CREATE TRIGGER trg_role_screen_updated_at
    BEFORE UPDATE ON role_screen_assignments
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- FUNCTION: Audit log trigger (INSERT/UPDATE/DELETE)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_action    audit_action;
    v_old_value JSONB := NULL;
    v_new_value JSONB := NULL;
BEGIN
    IF    TG_OP = 'INSERT' THEN v_action := 'CREATE'; v_new_value := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN v_action := 'UPDATE'; v_old_value := to_jsonb(OLD); v_new_value := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN v_action := 'DELETE'; v_old_value := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_logs(value)
    VALUES (jsonb_build_object(
        'action',      v_action,
        'entity',      TG_TABLE_NAME,
        'entity_id',   COALESCE(NEW.id, OLD.id),
        'old_value',   v_old_value,
        'new_value',   v_new_value,
        'service',     'database',
        'logged_at',   NOW()
    ));

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Audit triggers on main tables
CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_internships
    AFTER INSERT OR UPDATE OR DELETE ON internships
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_permissions
    AFTER INSERT OR UPDATE OR DELETE ON role_screen_assignments
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_files
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================================
-- FUNCTION: pg_notify → RabbitMQ bridge
-- Services listen to these channels via LISTEN/NOTIFY
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notify_change()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
    v_channel TEXT;
BEGIN
    v_channel := TG_TABLE_NAME || '.' || LOWER(TG_OP);
    v_payload := json_build_object(
        'table',      TG_TABLE_NAME,
        'action',     TG_OP,
        'id',         COALESCE(NEW.id, OLD.id),
        'timestamp',  NOW()
    );
    PERFORM pg_notify(v_channel, v_payload::TEXT);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Notify triggers
CREATE TRIGGER trg_notify_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_notify_change();

CREATE TRIGGER trg_notify_internships
    AFTER INSERT OR UPDATE OR DELETE ON internships
    FOR EACH ROW EXECUTE FUNCTION fn_notify_change();

CREATE TRIGGER trg_notify_files
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION fn_notify_change();
