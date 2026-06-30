-- Allow room_id to be null in blocked_slots (null = all rooms blocked, e.g. holidays)
ALTER TABLE public.blocked_slots ALTER COLUMN room_id DROP NOT NULL;
-- Allow blocked_time to be null (null = entire day blocked)
ALTER TABLE public.blocked_slots ALTER COLUMN blocked_time DROP NOT NULL;

-- Pricing tiers table
CREATE TABLE public.pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  min_players integer NOT NULL,
  max_players integer NOT NULL,
  price integer NOT NULL,
  highlight boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing_tiers"
  ON public.pricing_tiers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage pricing_tiers"
  ON public.pricing_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default tiers
INSERT INTO public.pricing_tiers (label, min_players, max_players, price, highlight, sort_order)
VALUES
  ('2 a 3 jugadores', 2, 3, 25000, false, 1),
  ('4 a 6 jugadores', 4, 6, 23000, true, 2),
  ('7 a 10 jugadores', 7, 10, 21000, false, 3);
