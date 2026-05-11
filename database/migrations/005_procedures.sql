-- ============================================================
-- EduConnect: 005 - Stored Procedures
-- Supervisor işlemleri için kompleks prosedürler
-- ============================================================

-- ============================================================
-- sp_assign_screen(role, screen_name, permissions, by_user_id)
-- Supervisor bir ekranı bir role atar
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_assign_screen(
    p_role         user_role,
    p_screen_name  VARCHAR(100),
    p_can_create   BOOLEAN,
    p_can_read     BOOLEAN,
    p_can_update   BOOLEAN,
    p_can_delete   BOOLEAN,
    p_assigned_by  BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_screen_id BIGINT;
BEGIN
    SELECT id INTO v_screen_id FROM screens WHERE value->>'name' = p_screen_name;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Screen "%" not found', p_screen_name;
    END IF;

    INSERT INTO role_screen_assignments(role, screen_id, value)
    VALUES (
        p_role, v_screen_id,
        jsonb_build_object(
            'can_create',        p_can_create,
            'can_read',          p_can_read,
            'can_update',        p_can_update,
            'can_delete',        p_can_delete,
            'assigned_by_user_id', p_assigned_by
        )
    )
    ON CONFLICT (role, screen_id) DO UPDATE
    SET value = jsonb_build_object(
            'can_create',        p_can_create,
            'can_read',          p_can_read,
            'can_update',        p_can_update,
            'can_delete',        p_can_delete,
            'assigned_by_user_id', p_assigned_by
        ),
        updated_at = NOW();
END;
$$;

-- ============================================================
-- sp_revoke_screen(role, screen_name, by_user_id)
-- Supervisor bir ekranı bir rolden kaldırır
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_revoke_screen(
    p_role        user_role,
    p_screen_name VARCHAR(100),
    p_by_user_id  BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_screen_id BIGINT;
BEGIN
    SELECT id INTO v_screen_id FROM screens WHERE value->>'name' = p_screen_name;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Screen "%" not found', p_screen_name;
    END IF;

    DELETE FROM role_screen_assignments
    WHERE role = p_role AND screen_id = v_screen_id;

    INSERT INTO audit_logs(value)
    VALUES (jsonb_build_object(
        'action',      'UPDATE',
        'entity',      'role_screen_assignments',
        'entity_id',   v_screen_id,
        'old_value',   jsonb_build_object('role', p_role, 'screen', p_screen_name),
        'new_value',   null,
        'user_id',     p_by_user_id,
        'service',     'database',
        'description', 'Screen revoked from role'
    ));
END;
$$;

-- ============================================================
-- sp_update_file_restrictions(role, allowed_extensions[])
-- Supervisor dosya tipi kısıtlamalarını günceller
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_update_file_restrictions(
    p_role       user_role,
    p_extensions TEXT[],
    p_by_user_id BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Validate extensions (only allowed types)
    IF NOT (p_extensions <@ ARRAY['txt','png','jpg','jpeg','pdf','docx','xlsx']) THEN
        RAISE EXCEPTION 'Invalid file extension. Allowed: txt, png, jpg, jpeg, pdf, docx, xlsx';
    END IF;

    UPDATE file_type_restrictions
    SET value = jsonb_build_object('allowed_extensions', to_jsonb(p_extensions)),
        updated_at = NOW()
    WHERE role = p_role;

    INSERT INTO audit_logs(value)
    VALUES (jsonb_build_object(
        'action',      'UPDATE',
        'entity',      'file_type_restrictions',
        'entity_id',   p_role,
        'new_value',   to_jsonb(p_extensions),
        'user_id',     p_by_user_id,
        'service',     'database'
    ));
END;
$$;

-- ============================================================
-- sp_create_internship_application(listing_id, student_id)
-- Staj başvurusu oluşturur ve school_id'yi otomatik belirler
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_create_internship_application(
    p_listing_id BIGINT,
    p_student_id BIGINT,
    OUT p_internship_id BIGINT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_school_id BIGINT;
    v_listing_active BOOLEAN;
BEGIN
    -- Check listing is active
    SELECT is_active INTO v_listing_active FROM internship_listings WHERE id = p_listing_id;
    IF NOT FOUND OR NOT v_listing_active THEN
        RAISE EXCEPTION 'Internship listing % is not available', p_listing_id;
    END IF;

    -- Get student's school
    SELECT school_id INTO v_school_id FROM students WHERE id = p_student_id;

    -- Check for duplicate application
    IF EXISTS(SELECT 1 FROM internships WHERE listing_id = p_listing_id AND student_id = p_student_id) THEN
        RAISE EXCEPTION 'Student % already applied to listing %', p_student_id, p_listing_id;
    END IF;

    INSERT INTO internships(listing_id, student_id, school_id, status, value)
    VALUES (
        p_listing_id, p_student_id, v_school_id, 'pending',
        jsonb_build_object('applied_at', NOW())
    )
    RETURNING id INTO p_internship_id;
END;
$$;

-- ============================================================
-- sp_update_internship_status(internship_id, new_status, note)
-- Staj durumunu günceller
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_update_internship_status(
    p_internship_id BIGINT,
    p_new_status    internship_status,
    p_note          TEXT DEFAULT NULL,
    p_by_user_id    BIGINT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE internships
    SET status = p_new_status,
        value  = value || jsonb_build_object(
            'status_updated_at', NOW(),
            'status_note',       p_note,
            'updated_by',        p_by_user_id
        )
    WHERE id = p_internship_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Internship % not found', p_internship_id;
    END IF;
END;
$$;
