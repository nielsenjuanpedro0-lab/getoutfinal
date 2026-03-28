-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admins can read all roles
CREATE POLICY "Admins can read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  badge TEXT,
  difficulty TEXT,
  difficulty_value INTEGER DEFAULT 5,
  max_difficulty INTEGER DEFAULT 10,
  players TEXT DEFAULT '2-10 jugadores',
  time TEXT DEFAULT '60 minutos',
  description TEXT,
  tagline TEXT,
  extra TEXT,
  accent_color TEXT DEFAULT '#E67E22',
  escape_map_rank INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rooms" ON public.rooms
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  num_players INTEGER DEFAULT 2,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Blocked slots (manual blocks by admin)
CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  blocked_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked slots" ON public.blocked_slots
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed rooms
INSERT INTO public.rooms (name, slug, badge, difficulty, difficulty_value, max_difficulty, players, time, description, tagline, extra, accent_color, escape_map_rank, sort_order)
VALUES
  ('El Refugio', 'el-refugio', 'Terror / Misterio / Suspenso', '8 o 10', 9, 10, '2-10 jugadores', '60 minutos',
   'En el parque estan sucediendo cosas extrañas. Atraidos por estos misterios, se adentran entre los arboles hasta que una tormenta los alcanza. Encuentran una cabaña para refugiarse, pero deberan escapar antes de que su dueño regrese.',
   'El parque oculta un misterio. Te animas a descubrirlo?',
   'Dificultad: 8 o 10 (a eleccion) - Genero: Misterio/Suspenso/Suspenso con terror (a eleccion)',
   '#E67E22', 3, 1),
  ('Ruinas de Copan', 'ruinas-de-copan', 'Aventura', '6', 6, 10, '2-10 jugadores', '60 minutos',
   'Nuestro amigo Harry ha desaparecido. Revisando en su casa, descubrimos que se fue de viaje hasta Las Ruinas de Copan, en busqueda de un pequeño pero valioso tesoro.',
   'Escaparas con el tesoro?', NULL, '#f0a500', 2, 2),
  ('Inculpados', 'inculpados', 'Policial', '7', 7, 10, '2-10 jugadores', '60 minutos',
   'El casino de nuestra ciudad fue robado. Ustedes han sido inculpados por este robo, y encerrados en el departamento de detencion. Deberan descubrir al verdadero culpable antes de que el comisario Harry regrese a su despacho.',
   'Descubre al culpable o enfrenta su condena.', NULL, '#4A90D9', NULL, 3);
