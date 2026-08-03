DELETE FROM public.push_subscriptions a
USING public.push_subscriptions b
WHERE a.user_id = b.user_id
  AND (
    a.created_at < b.created_at
    OR (a.created_at = b.created_at AND a.id < b.id)
  );

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);

GRANT UPDATE ON public.push_subscriptions TO authenticated;
