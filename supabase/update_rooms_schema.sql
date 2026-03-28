-- Activar la extensión si no está activa (por defecto en Supabase suele estarlo)
-- Agregar columnas faltantes a la tabla rooms

ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS price integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_players integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_players integer DEFAULT 6;

-- Asegurarse de que el status de la tabla bookings permita 'paid' y otros estados explícitos en caso de usar check constraints (si no hay constraints, no hace falta, pero validamos que los estados sean texto libre)
-- Actualmente status es tipo text, no hay un enum para el status de las reservas en types.ts (el único enum es app_role).
