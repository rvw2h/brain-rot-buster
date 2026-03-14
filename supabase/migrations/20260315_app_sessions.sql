CREATE TABLE public.app_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ DEFAULT now(),
  method       TEXT  -- 'google' | 'manual' | 'auto'
);

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_sessions: insert own"
  ON public.app_sessions FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM public.users WHERE google_id = auth.uid()::text
  ));

CREATE POLICY "app_sessions: select own"
  ON public.app_sessions FOR SELECT
  USING (user_id = (
    SELECT id FROM public.users WHERE google_id = auth.uid()::text
  ));
