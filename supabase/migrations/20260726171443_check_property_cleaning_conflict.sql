CREATE OR REPLACE FUNCTION public.check_property_cleaning_on_date (
    p_property_id UUID,
    p_check_date DATE
) RETURNS TABLE (id UUID, status TEXT) SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.id = p_property_id AND host_id = auth.uid() AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Unauthorised' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN QUERY
    SELECT c.id, c.status::TEXT
    FROM public.cleanings c
    WHERE c.property_id = p_property_id
      AND c.scheduled_start::DATE = p_check_date
      AND c.deleted_at IS NULL
      AND c.status NOT IN ('cancelled');
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.check_property_cleaning_on_date (uuid, date) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.check_property_cleaning_on_date (uuid, date) TO authenticated;
