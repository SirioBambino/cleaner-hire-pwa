CREATE POLICY "Authenticated users can view properties" ON public.properties FOR
SELECT
    TO authenticated USING (
        public.is_not_banned ()
        AND deleted_at IS NULL
    );