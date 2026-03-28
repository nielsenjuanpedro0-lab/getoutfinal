
CREATE TABLE public.room_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  time_slot time NOT NULL,
  UNIQUE(room_id, time_slot)
);

ALTER TABLE public.room_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read room_time_slots"
  ON public.room_time_slots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage room_time_slots"
  ON public.room_time_slots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
