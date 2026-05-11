-- ============================================================
-- EduConnect: 004 - Functions
-- İzin kontrol, arama, profil skorlama fonksiyonları
-- ============================================================

-- ============================================================
-- fn_check_permission(user_id, screen_name, action)
-- Bir kullanıcının belirli bir ekranda belirli işlemi yapıp yapamayacağını döner
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_permission(
    p_user_id    BIGINT,
    p_screen     VARCHAR(100),
    p_action     VARCHAR(20)  -- 'create' | 'read' | 'update' | 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role    user_role;
    v_result  BOOLEAN := FALSE;
BEGIN
    -- Get user role
    SELECT role INTO v_role FROM users WHERE id = p_user_id AND is_active = TRUE;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- Supervisor has all permissions
    IF v_role = 'supervisor' THEN RETURN TRUE; END IF;

    -- Check assignment
    SELECT (rsa.value->>('can_' || p_action))::BOOLEAN
    INTO v_result
    FROM role_screen_assignments rsa
    JOIN screens s ON s.id = rsa.screen_id
    WHERE rsa.role = v_role
      AND s.value->>'name' = p_screen;

    RETURN COALESCE(v_result, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- fn_get_user_screens(user_id)
-- Kullanıcının görebileceği tüm ekranları JSON dizisi olarak döner
-- ============================================================
CREATE OR REPLACE FUNCTION fn_get_user_screens(p_user_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_result JSONB;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id AND is_active = TRUE;
    IF NOT FOUND THEN RETURN '[]'::JSONB; END IF;

    IF v_role = 'supervisor' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'screen', s.value,
                'permissions', jsonb_build_object(
                    'can_create', true, 'can_read', true,
                    'can_update', true, 'can_delete', true
                )
            )
        ) INTO v_result FROM screens s;
    ELSE
        SELECT jsonb_agg(
            jsonb_build_object(
                'screen', s.value,
                'permissions', jsonb_build_object(
                    'can_create', (rsa.value->>'can_create')::BOOLEAN,
                    'can_read',   (rsa.value->>'can_read')::BOOLEAN,
                    'can_update', (rsa.value->>'can_update')::BOOLEAN,
                    'can_delete', (rsa.value->>'can_delete')::BOOLEAN
                )
            )
        ) INTO v_result
        FROM role_screen_assignments rsa
        JOIN screens s ON s.id = rsa.screen_id
        WHERE rsa.role = v_role
          AND (rsa.value->>'can_read')::BOOLEAN = TRUE;
    END IF;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- fn_get_allowed_file_types(user_id)
-- Kullanıcının yükleyebileceği dosya tiplerini döner
-- ============================================================
CREATE OR REPLACE FUNCTION fn_get_allowed_file_types(p_user_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_role   user_role;
    v_result JSONB;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN RETURN '[]'::JSONB; END IF;

    SELECT value->'allowed_extensions'
    INTO v_result
    FROM file_type_restrictions
    WHERE role = v_role;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- fn_search_students(skills, school_id, min_gpa)
-- İşletmelerin JSONB üzerinde öğrenci araması (GIN index kullanır)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_search_students(
    p_skills    TEXT[]   DEFAULT NULL,
    p_school_id BIGINT   DEFAULT NULL,
    p_min_gpa   NUMERIC  DEFAULT NULL,
    p_limit     INT      DEFAULT 20,
    p_offset    INT      DEFAULT 0
)
RETURNS TABLE(
    student_id   BIGINT,
    user_id      BIGINT,
    school_id    BIGINT,
    student_data JSONB,
    user_data    JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        st.id,
        st.user_id,
        st.school_id,
        st.value,
        u.value
    FROM students st
    JOIN users u ON u.id = st.user_id
    WHERE u.is_active = TRUE
      AND (p_school_id IS NULL OR st.school_id = p_school_id)
      AND (p_min_gpa   IS NULL OR (st.value->>'gpa')::NUMERIC >= p_min_gpa)
      AND (p_skills    IS NULL OR st.value->'skills' ?| p_skills)
    ORDER BY (st.value->>'gpa')::NUMERIC DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- fn_calculate_student_score(student_id)
-- Öğrenci profil tamlık skoru (0-100)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_calculate_student_score(p_student_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    v_value JSONB;
    v_score INT := 0;
BEGIN
    SELECT value INTO v_value FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    IF v_value ? 'bio'          AND length(v_value->>'bio') > 10   THEN v_score := v_score + 10; END IF;
    IF v_value ? 'skills'       AND jsonb_array_length(v_value->'skills') > 0 THEN v_score := v_score + 20; END IF;
    IF v_value ? 'projects'     AND jsonb_array_length(v_value->'projects') > 0 THEN v_score := v_score + 20; END IF;
    IF v_value ? 'cv_url'       AND v_value->>'cv_url' != ''        THEN v_score := v_score + 15; END IF;
    IF v_value ? 'linkedin_url' AND v_value->>'linkedin_url' != ''  THEN v_score := v_score + 10; END IF;
    IF v_value ? 'github_url'   AND v_value->>'github_url' != ''    THEN v_score := v_score + 10; END IF;
    IF v_value ? 'gpa'          AND (v_value->>'gpa')::NUMERIC > 0  THEN v_score := v_score + 5;  END IF;
    IF v_value ? 'certificates' AND jsonb_array_length(v_value->'certificates') > 0 THEN v_score := v_score + 10; END IF;

    RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE;
