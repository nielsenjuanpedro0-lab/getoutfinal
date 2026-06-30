-- Duration field for bookings (birthday parties, extended sessions)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes_internal text;

-- Business config table (open days, hours, etc.)
CREATE TABLE IF NOT EXISTS public.business_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read business_config"
  ON public.business_config FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage business_config"
  ON public.business_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Default: open Saturday (6) and Sunday (0)
INSERT INTO public.business_config (key, value)
VALUES ('open_days', '[0, 6]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Total daily slots for occupancy calculation
INSERT INTO public.business_config (key, value)
VALUES ('total_daily_slots', '12'::jsonb)
ON CONFLICT (key) DO NOTHING;
