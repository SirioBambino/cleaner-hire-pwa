-- Add main_cleaner_id to properties for auto-assignment of cleaners to cleanings
ALTER TABLE public.properties ADD COLUMN main_cleaner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- RPC to set/clear the main cleaner for a property
CREATE OR REPLACE FUNCTION public.admin_set_property_main_cleaner (
    p_property_id UUID,
    p_cleaner_id UUID DEFAULT NULL
) RETURNS VOID SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
        RAISE EXCEPTION 'Unauthorised: Only admins can perform this action' USING ERRCODE = 'P0001';
    END IF;

    IF p_cleaner_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_cleaner_id AND role = 'cleaner' AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Invalid cleaner ID';
        END IF;
    END IF;

    UPDATE public.properties
    SET main_cleaner_id = p_cleaner_id,
        updated_at = now()
    WHERE id = p_property_id;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.admin_set_property_main_cleaner (uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_set_property_main_cleaner (uuid, uuid) TO authenticated;

-- Update create_cleaning_request (host-side) to auto-assign main cleaner
CREATE OR REPLACE FUNCTION public.create_cleaning_request (
    p_property_id UUID,
    p_custom_tasks TEXT[],
    p_information TEXT,
    p_scheduled_start TIMESTAMPTZ,
    p_stocks_included BOOLEAN DEFAULT FALSE
) RETURNS UUID SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_cleaning_id UUID;
    v_host_id UUID;
    v_property_type TEXT;
    v_bedrooms INT;
    v_price_per_cleaning NUMERIC;
    v_main_cleaner_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND host_id = (SELECT auth.uid()) AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Unauthorised' USING ERRCODE = 'P0001';
    END IF;

    SELECT p.host_id, p.type, p.bedrooms, p.price_per_cleaning, p.main_cleaner_id
    INTO v_host_id, v_property_type, v_bedrooms, v_price_per_cleaning, v_main_cleaner_id
    FROM public.properties p WHERE p.id = p_property_id;

    INSERT INTO public.cleanings (property_id, host_id, scheduled_start, status, information, stocks_included, service_cost, cleaner_id)
    VALUES (
        p_property_id,
        v_host_id,
        p_scheduled_start,
        CASE WHEN v_main_cleaner_id IS NOT NULL THEN 'confirmed'::cleaning_status ELSE 'requested'::cleaning_status END,
        p_information,
        p_stocks_included,
        v_price_per_cleaning,
        v_main_cleaner_id
    )
    RETURNING id INTO v_cleaning_id;

    INSERT INTO public.cleaning_tasks (cleaning_id, description, is_custom, is_completed)
    SELECT v_cleaning_id, description, false, false FROM standard_tasks WHERE is_active = true;

    IF p_custom_tasks IS NOT NULL THEN
        INSERT INTO public.cleaning_tasks (cleaning_id, description, is_custom, is_completed)
        SELECT v_cleaning_id, task_desc, true, false FROM unnest(p_custom_tasks) AS task_desc;
    END IF;

    RETURN v_cleaning_id;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.create_cleaning_request FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_cleaning_request TO authenticated;

-- Update admin_create_cleaning_for_host (admin-side) to auto-assign main cleaner
CREATE OR REPLACE FUNCTION public.admin_create_cleaning_for_host (
    p_host_id UUID,
    p_property_id UUID,
    p_scheduled_start TIMESTAMPTZ,
    p_information TEXT DEFAULT NULL,
    p_stocks_included BOOLEAN DEFAULT FALSE,
    p_custom_tasks TEXT[] DEFAULT '{}'
) RETURNS UUID SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_cleaning_id UUID;
    v_property_type TEXT;
    v_bedrooms INT;
    v_price_per_cleaning NUMERIC;
    v_main_cleaner_id UUID;
BEGIN
    IF ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
        RAISE EXCEPTION 'Unauthorised: Only admins can perform this action' USING ERRCODE = 'P0001';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND host_id = p_host_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Ownership mismatch';
    END IF;

    SELECT p.type, p.bedrooms, p.price_per_cleaning, p.main_cleaner_id
    INTO v_property_type, v_bedrooms, v_price_per_cleaning, v_main_cleaner_id
    FROM public.properties p WHERE p.id = p_property_id;

    INSERT INTO public.cleanings (host_id, property_id, scheduled_start, status, information, stocks_included, service_cost, cleaner_id)
    VALUES (
        p_host_id,
        p_property_id,
        p_scheduled_start,
        CASE WHEN v_main_cleaner_id IS NOT NULL THEN 'confirmed'::cleaning_status ELSE 'requested'::cleaning_status END,
        p_information,
        p_stocks_included,
        v_price_per_cleaning,
        v_main_cleaner_id
    )
    RETURNING id INTO v_cleaning_id;

    INSERT INTO public.cleaning_tasks (cleaning_id, description, is_custom)
    SELECT v_cleaning_id, description, false FROM public.standard_tasks WHERE is_active = true;

    IF array_length(p_custom_tasks, 1) > 0 THEN
        INSERT INTO public.cleaning_tasks (cleaning_id, description, is_custom)
        SELECT v_cleaning_id, t, true FROM unnest(p_custom_tasks) t;
    END IF;

    RETURN v_cleaning_id;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.admin_create_cleaning_for_host FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_create_cleaning_for_host TO authenticated;

-- Update admin_get_host_detail to include main_cleaner_id, main_cleaner_name, and fix missing extra_images_urls
CREATE OR REPLACE FUNCTION public.admin_get_host_detail (
    p_host_id UUID,
    p_properties_sort_field TEXT DEFAULT 'created_at',
    p_properties_sort_direction TEXT DEFAULT 'desc',
    p_cleanings_sort_field TEXT DEFAULT 'created_at',
    p_cleanings_sort_direction TEXT DEFAULT 'desc'
) RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_verified BOOLEAN,
    avatar_url TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_text TEXT,
    is_online BOOLEAN,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    properties JSONB,
    cleanings JSONB,
    cleaning_stats JSONB
) SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
        RAISE EXCEPTION 'Unauthorised: Only admins can perform this action' USING ERRCODE = 'P0001';
    END IF;
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.full_name,
        p.role::TEXT,
        p.is_verified,
        p.avatar_url,
        au.banned_until,
        au.created_at AS created_at,
        au.last_sign_in_at AS last_sign_in_at,
        CASE
            WHEN au.last_sign_in_at IS NULL THEN 'Never'
            WHEN au.last_sign_in_at > NOW() - INTERVAL '24 hours' THEN 'Today'
            WHEN au.last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'This week'
            WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'This month'
            WHEN au.last_sign_in_at > NOW() - INTERVAL '3 months' THEN 'Past 3 months'
            WHEN au.last_sign_in_at > NOW() - INTERVAL '6 months' THEN 'Past 6 months'
            WHEN au.last_sign_in_at > NOW() - INTERVAL '1 year' THEN 'Past year'
            ELSE 'More than a year ago'
        END AS last_sign_in_text,
        p.last_seen_at IS NOT NULL AND p.last_seen_at > now() - interval '5 minutes' as is_online,
        p.last_seen_at,
        p.deleted_at,
        (
            SELECT COALESCE(jsonb_agg(row), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object(
                    'id', pr.id,
                    'address_line_1', pr.address_line_1,
                    'postcode', pr.postcode,
                    'town_city', pr.town_city,
                    'type', pr.type,
                    'bedrooms', pr.bedrooms,
                    'bathrooms', pr.bathrooms,
                    'main_image_url', pr.main_image_url,
                    'extra_images_urls', pr.extra_images_urls,
                    'price_per_cleaning', pr.price_per_cleaning,
                    'cleaner_pay_override', pr.cleaner_pay_override,
                    'main_cleaner_id', pr.main_cleaner_id,
                    'main_cleaner_name', mc.full_name,
                    'created_at', pr.created_at
                ) AS row
                FROM public.properties pr
                LEFT JOIN public.profiles mc ON mc.id = pr.main_cleaner_id
                WHERE pr.host_id = p_host_id AND pr.deleted_at IS NULL
                ORDER BY
                    CASE WHEN p_properties_sort_direction = 'asc' THEN
                        CASE p_properties_sort_field
                            WHEN 'address_line_1' THEN pr.address_line_1
                            WHEN 'postcode' THEN pr.postcode
                            WHEN 'town_city' THEN pr.town_city
                            WHEN 'type' THEN pr.type::text
                            WHEN 'bedrooms' THEN pr.bedrooms::text
                            WHEN 'bathrooms' THEN pr.bathrooms::text
                            WHEN 'price_per_cleaning' THEN pr.price_per_cleaning::text
                            WHEN 'cleaner_pay_override' THEN pr.cleaner_pay_override::text
                            WHEN 'main_cleaner_name' THEN mc.full_name
                            ELSE pr.created_at::text
                        END
                    END ASC NULLS LAST,
                    CASE WHEN p_properties_sort_direction = 'desc' OR p_properties_sort_direction IS NULL THEN
                        CASE p_properties_sort_field
                            WHEN 'address_line_1' THEN pr.address_line_1
                            WHEN 'postcode' THEN pr.postcode
                            WHEN 'town_city' THEN pr.town_city
                            WHEN 'type' THEN pr.type::text
                            WHEN 'bedrooms' THEN pr.bedrooms::text
                            WHEN 'bathrooms' THEN pr.bathrooms::text
                            WHEN 'price_per_cleaning' THEN pr.price_per_cleaning::text
                            WHEN 'cleaner_pay_override' THEN pr.cleaner_pay_override::text
                            WHEN 'main_cleaner_name' THEN mc.full_name
                            ELSE pr.created_at::text
                        END
                    END DESC NULLS LAST
            ) AS props
        ),
        (
            SELECT COALESCE(jsonb_agg(row), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object(
                    'id', c.id,
                    'status', c.status,
                    'scheduled_start', c.scheduled_start,
                    'service_cost', c.service_cost,
                    'cleaner_pay', c.cleaner_pay,
                    'cleaner_id', c.cleaner_id,
                    'property_id', c.property_id,
                    'created_at', c.created_at,
                    'cleaner_name', cl.full_name,
                    'host_name', hp.full_name,
                    'property_town_city', pr.town_city,
                    'property_address', pr.address_line_1,
                    'property_postcode', pr.postcode
                ) AS row
                FROM public.cleanings c
                LEFT JOIN public.profiles cl ON cl.id = c.cleaner_id
                LEFT JOIN public.profiles hp ON c.host_id = hp.id
                LEFT JOIN public.properties pr ON c.property_id = pr.id
                WHERE c.host_id = p_host_id AND c.deleted_at IS NULL
                ORDER BY
                    CASE WHEN p_cleanings_sort_direction = 'asc' THEN
                        CASE p_cleanings_sort_field
                            WHEN 'date' THEN c.scheduled_start::text
                            WHEN 'time' THEN c.scheduled_start::text
                            WHEN 'status' THEN c.status::text
                            WHEN 'host_name' THEN hp.full_name
                            WHEN 'cleaner_name' THEN cl.full_name
                            WHEN 'service_cost' THEN c.service_cost::text
                            WHEN 'cleaner_pay' THEN c.cleaner_pay::text
                            ELSE c.created_at::text
                        END
                    END ASC NULLS LAST,
                    CASE WHEN p_cleanings_sort_direction = 'desc' OR p_cleanings_sort_direction IS NULL THEN
                        CASE p_cleanings_sort_field
                            WHEN 'date' THEN c.scheduled_start::text
                            WHEN 'time' THEN c.scheduled_start::text
                            WHEN 'status' THEN c.status::text
                            WHEN 'host_name' THEN hp.full_name
                            WHEN 'cleaner_name' THEN cl.full_name
                            WHEN 'service_cost' THEN c.service_cost::text
                            WHEN 'cleaner_pay' THEN c.cleaner_pay::text
                            ELSE c.created_at::text
                        END
                    END DESC NULLS LAST
                LIMIT 50
            ) AS props
        ),
        (
            SELECT jsonb_build_object(
                'total', count(*),
                'requested', count(*) FILTER (WHERE c.status = 'requested'),
                'confirmed', count(*) FILTER (WHERE c.status = 'confirmed'),
                'in_progress', count(*) FILTER (WHERE c.status = 'in_progress')
            )
            FROM public.cleanings c
            WHERE c.host_id = p_host_id AND c.deleted_at IS NULL
        )
    FROM public.profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE p.id = p_host_id AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.admin_get_host_detail (uuid, text, text, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_get_host_detail (uuid, text, text, text, text) TO authenticated;
