CREATE
OR REPLACE FUNCTION public.calculate_cleaner_pay (p_property_id UUID) RETURNS NUMERIC(10, 2) LANGUAGE plpgsql SECURITY DEFINER
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
    SELECT p.cleaner_pay_override, p.type, p.bedrooms, p.bathrooms
    INTO v_cleaner_pay_override, v_property_type, v_bedrooms, v_bathrooms
    FROM public.properties p
    WHERE p.id = p_property_id;

    IF v_cleaner_pay_override IS NOT NULL THEN
        RETURN v_cleaner_pay_override;
    END IF;

    SELECT c.hourly_rate, c.target_times, c.bathroom_time
    INTO v_hourly_rate, v_target_times, v_bathroom_time
    FROM cleaner_pay_config c
    WHERE c.id = 1;

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

    RETURN ROUND(v_hourly_rate * COALESCE(v_target_hours, 0), 2);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.calculate_cleaner_pay (uuid)
FROM
    PUBLIC,
    anon;

GRANT
EXECUTE ON FUNCTION public.calculate_cleaner_pay (uuid) TO authenticated;

CREATE
OR REPLACE FUNCTION public.set_cleaner_pay_on_cleaning_insert () RETURNS TRIGGER LANGUAGE plpgsql
SET
    search_path = public AS $$
BEGIN
    NEW.cleaner_pay := public.calculate_cleaner_pay(NEW.property_id);
    RETURN NEW;
END;
$$;

CREATE
OR REPLACE FUNCTION public.update_cleaner_pay_config (p_hourly_rate NUMERIC, p_target_times JSONB, p_bathroom_time NUMERIC DEFAULT 0.5) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = public AS $$
BEGIN
    IF ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
        RAISE EXCEPTION 'Unauthorised: Only admins can perform this action';
    END IF;

    UPDATE cleaner_pay_config
    SET hourly_rate = p_hourly_rate,
        target_times = p_target_times,
        bathroom_time = p_bathroom_time,
        updated_at = NOW()
    WHERE id = 1;

    UPDATE public.cleanings c
    SET cleaner_pay = public.calculate_cleaner_pay(c.property_id),
        updated_at = NOW()
    WHERE c.deleted_at IS NULL
      AND c.status IN ('requested', 'confirmed')
      AND c.cleaner_pay IS DISTINCT FROM public.calculate_cleaner_pay(c.property_id);
END;
$$;

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

    UPDATE public.cleanings c
    SET cleaner_pay = public.calculate_cleaner_pay(c.property_id),
        updated_at = NOW()
    WHERE c.property_id = p_property_id
      AND c.deleted_at IS NULL
      AND c.status IN ('requested', 'confirmed')
      AND c.cleaner_pay IS DISTINCT FROM public.calculate_cleaner_pay(c.property_id);
END;
$$ LANGUAGE plpgsql;

GRANT
SELECT
    ON TABLE public.cleaner_pay_config TO authenticated;

CREATE POLICY "Authenticated users can read cleaner_pay_config" ON public.cleaner_pay_config FOR
SELECT
    TO authenticated USING (true);