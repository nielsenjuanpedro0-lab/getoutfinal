-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Crear Enum para Roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear Tabla Rooms (Salas)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    badge TEXT,
    tagline TEXT,
    difficulty TEXT,
    difficulty_value INTEGER DEFAULT 5,
    max_difficulty INTEGER DEFAULT 10,
    accent_color TEXT,
    escape_map_rank INTEGER,
    time TEXT DEFAULT '60 min',
    players TEXT DEFAULT '2 a 6',
    min_players INTEGER DEFAULT 2,
    max_players INTEGER DEFAULT 6,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    extra TEXT
);

-- 3. Crear Tabla Bookings (Reservas)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    num_players INTEGER DEFAULT 2,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'cancelled', 'completed'
    payment_status TEXT,
    notes TEXT
);

-- 4. Crear Tabla Blocked Slots (Horarios bloqueados)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    blocked_time TIME,
    reason TEXT
);

-- 5. Crear Tabla Room Time Slots (Configuracion de turnos por defecto para calendario)
CREATE TABLE IF NOT EXISTS public.room_time_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    time_slot TIME NOT NULL
);

-- 6. Crear Tabla User Roles (Roles de usuario para el Admin Dashboard)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user'
);

-- =========================================================================================
-- POLITICAS DE SEGURIDAD (RLS - Row Level Security)
-- =========================================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Politicas Salas (Rooms): Lectura publica, Escritura solo admins
CREATE POLICY "Public rooms are viewable by everyone." ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Admin can insert rooms." ON public.rooms FOR INSERT WITH CHECK ( EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin') );
CREATE POLICY "Admin can update rooms." ON public.rooms FOR UPDATE USING ( EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin') );
CREATE POLICY "Admin can delete rooms." ON public.rooms FOR DELETE USING ( EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin') );

-- Politicas Bookings (Lectura/Escritura libre para front-end o restringir segun convenga)
-- Nota: Para este dashboard asumimos que los clientes crean reservas desde la web publica.
CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view bookings (para validacion front)" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Admin can update/delete bookings" ON public.bookings FOR ALL USING ( EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin') );

-- Politicas Blocked Slots
CREATE POLICY "Public can view blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Admin can manage blocked slots" ON public.blocked_slots FOR ALL USING ( EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin') );

-- Politicas Roles User
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
-- (Normalmente los roles se asignan via trigger o desde el dashboard de Supabase)

-- Función útil: Trigger para actualizar `updated_at` en tablas compatibles
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
