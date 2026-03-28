-- Insertar las 3 salas iniciales de la landing page

INSERT INTO public.rooms (
  name, slug, badge, difficulty, difficulty_value, max_difficulty, players, min_players, max_players,
  time, description, tagline, extra, accent_color, escape_map_rank, image_url, price, is_active, sort_order
) VALUES 
('El Refugio', 'el-refugio', 'Terror / Misterio / Suspenso', '8 o 10', 9, 10, '2–10 jugadores', 2, 10, '60 minutos', 'En el parque están sucediendo cosas extrañas. Atraídos por estos misterios, se adentran entre los árboles hasta que una tormenta los alcanza. Encuentran una cabaña para refugiarse, pero deberán escapar antes de que su dueño regrese.', 'El parque oculta un misterio. ¿Te animás a descubrirlo?', 'Dificultad: 8 o 10 (a elección) · Género: Misterio/Suspenso/Suspenso con terror (a elección)', '#E67E22', 3, '/room-refugio.jpg', 3000, true, 1),
('Ruinas de Copan', 'ruinas-de-copan', 'Aventura', '6', 6, 10, '2–10 jugadores', 2, 10, '60 minutos', 'Nuestro amigo Harry ha desaparecido. Revisando en su casa, descubrimos que se fue de viaje hasta Las Ruinas de Copan, en búsqueda de un pequeño pero valioso tesoro. Emprendemos viaje hasta este lugar a ver si encontramos a nuestro amigo, y nos llevamos alguna riqueza.', '¿Escaparás con el tesoro?', null, '#f0a500', 2, '/room-copan.jpg', 3000, true, 2),
('Inculpados', 'inculpados', 'Policial', '7', 7, 10, '2–10 jugadores', 2, 10, '60 minutos', 'El casino de nuestra ciudad fue robado. Ustedes han sido inculpados por este robo, y encerrados en el departamento de detención. Deberán descubrir al verdadero culpable antes de que el comisario Harry regrese a su despacho.', 'Descubre al culpable o enfrenta su condena.', null, '#4A90D9', null, '/room-inculpados.jpg', 3000, true, 3)
ON CONFLICT (slug) DO UPDATE SET 
badge = EXCLUDED.badge, image_url = EXCLUDED.image_url, accent_color = EXCLUDED.accent_color, players = EXCLUDED.players;
