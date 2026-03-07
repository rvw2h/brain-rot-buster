
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_math_score INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_memory_score INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_coloring_score INTEGER DEFAULT 0;
ALTER TABLE public.users ALTER COLUMN google_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.memory_session_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  was_recalled BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_memory_session_words_session_id ON public.memory_session_words(session_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
