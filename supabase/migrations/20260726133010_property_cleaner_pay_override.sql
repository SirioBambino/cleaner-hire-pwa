ALTER TABLE public.properties
ADD COLUMN cleaner_pay_override NUMERIC(10, 2);

COMMENT ON COLUMN public.properties.cleaner_pay_override IS 'When set, overrides the automatic cleaner pay calculation for all new cleanings at this property';

CREATE
OR REPLACE FUNCTION public.set_cleaner_pay_on_cleaning_insert () RETURNS TRIGGER
SET
    search_path = public AS $$
DECLARE
    v_cleaner_pay_override NUMERIC;
    v_property_type TEXT;
    v_bedrooms INT;
    v_bathrooms INT;
    v_hourly_rate NUMERIC;
    v_target_times JSONB;
    v_bathroom_time NUMERIC;
    v_target_hours NUMERIC;
BEGIN
    SELECT p.cleaner_pay_override INTO v_cleaner_pay_override
    FROM public.properties p WHERE p.id = NEW.property_id;

    IF v_cleaner_pay_override IS NOT NULL THEN
        NEW.cleaner_pay := v_cleaner_pay_override;
        RETURN NEW;
    END IF;

    SELECT p.type, p.bedrooms, p.bathrooms INTO v_property_type, v_bedrooms, v_bathrooms
    FROM public.properties p WHERE p.id = NEW.property_id;

    SELECT c.hourly_rate, c.target_times, c.bathroom_time INTO v_hourly_rate, v_target_times, v_bathroom_time
    FROM cleaner_pay_config c WHERE c.id = 1;

    IF v_property_type = 'studio' THEN
        v_target_hours := (v_target_times->>'studio')::NUMERIC;
    ELSE
        v_target_hours := (v_target_times->>CONCAT(v_bedrooms, '_bed'))::NUMERIC;
        IF v_target_hours IS NULL THEN
            SELECT (v_target_times->>key)::NUMERIC INTO v_target_hours
            FROM jsonb_object_keys(v_target_times) AS key
            WHERE key ~ '^[0-9]+_bed$'
            ORDER BY LENGTH(key) DESC, key DESC
            LIMIT 1;
        END IF;
    END IF;

    v_target_hours := v_target_hours + GREATEST(0, v_bathrooms - 1) * COALESCE(v_bathroom_time, 0.5);

    NEW.cleaner_pay := ROUND(v_hourly_rate * COALESCE(v_target_hours, 0), 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.admin_update_property_price (uuid, numeric);

CREATE
OR REPLACE FUNCTION public.admin_update_property_price (p_property_id UUID, p_price NUMERIC, p_cleaner_pay_override NUMERIC DEFAULT NULL) RETURNS VOID SECURITY DEFINER
SET
    search_path = public AS $$
BEGIN
    IF ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
        RAISE EXCEPTION 'Unauthorised: Only admins can perform this action' USING ERRCODE = 'P0001';
    END IF;

    UPDATE properties
    SET price_per_cleaning = p_price,
        cleaner_pay_override = p_cleaner_pay_override
    WHERE id = p_property_id;
END;
$$ LANGUAGE plpgsql;

REVOKE
EXECUTE ON FUNCTION public.admin_update_property_price (uuid, numeric, numeric)
FROM
    PUBLIC,
    anon;

GRANT
EXECUTE ON FUNCTION public.admin_update_property_price (uuid, numeric, numeric) TO authenticated;

CREATE
OR REPLACE FUNCTION public.admin_get_host_detail (
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
SET
    search_path = public AS $$
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
                    'price_per_cleaning', pr.price_per_cleaning,
                    'cleaner_pay_override', pr.cleaner_pay_override,
                    'created_at', pr.created_at
                ) AS row
                FROM public.properties pr
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

REVOKE
EXECUTE ON FUNCTION public.admin_get_host_detail (uuid, text, text, text, text)
FROM
    PUBLIC,
    anon;

GRANT
EXECUTE ON FUNCTION public.admin_get_host_detail (uuid, text, text, text, text) TO authenticated;