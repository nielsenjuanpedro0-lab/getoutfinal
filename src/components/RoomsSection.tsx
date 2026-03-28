import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Users, ChevronLeft, ChevronRight, X, Trophy } from "lucide-react";
import roomRefugio from "@/assets/room-refugio.jpg";
import roomCopan from "@/assets/room-copan.jpg";
import roomInculpados from "@/assets/room-inculpados.jpg";

const getRoomImage = (room: any) => {
  const name = room.name?.toLowerCase() || '';
  if (name.includes('refugio')) return roomRefugio;
  if (name.includes('copan')) return roomCopan;
  if (name.includes('inculpados')) return roomInculpados;
  return room.image_url || '/placeholder.svg';
};

function DifficultyBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">Dificultad</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{value}/{max}</span>
    </div>
  );
}

function RoomModal({ room, onClose }: { room: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/70 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-md transition-colors hover:bg-black/50">
          <X size={24} />
        </button>
        <div className="relative w-full aspect-[4/5] rounded-t-xl overflow-hidden bg-black">
          <img src={getRoomImage(room)} alt={room.name} className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent pointer-events-none" />
          {room.escape_map_rank && (
            <div
              className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${room.accent_color}90`, color: '#fff', border: `1px solid ${room.accent_color}` }}
            >
              <Trophy size={14} /> N°{room.escape_map_rank} Escape Map
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <h3 className="font-display text-4xl" style={{ color: room.accent_color || '#fff' }}>{room.name}</h3>
          <p className="text-sm italic text-muted-foreground">{room.tagline}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users size={14} /> {room.players}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {room.time}</span>
            <span className="font-medium" style={{ color: room.accent_color }}>Dificultad: {room.difficulty}</span>
          </div>
          <DifficultyBar value={room.difficulty_value || 5} max={room.max_difficulty || 10} color={room.accent_color || '#E67E22'} />
          <p className="text-sm text-muted-foreground leading-relaxed">{room.description}</p>
          {room.extra && <p className="text-xs text-muted-foreground/70 italic">{room.extra}</p>}
          <a
            href="#reservar"
            onClick={onClose}
            className="block text-center font-bold text-sm py-3 rounded-md transition-all duration-200 active:scale-[0.97] mt-4 hover:brightness-110"
            style={{ backgroundColor: `${room.accent_color}20`, color: room.accent_color, border: `1px solid ${room.accent_color}80` }}
          >
            RESERVAR TURNO
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RoomsSection() {
  const [current, setCurrent] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['public-rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      return data || [];
    }
  });

  const prev = useCallback(() => {
    if(!rooms) return;
    setCurrent((c) => (c === 0 ? rooms.length - 1 : c - 1));
  }, [rooms]);

  const next = useCallback(() => {
    if(!rooms) return;
    setCurrent((c) => (c === rooms.length - 1 ? 0 : c + 1));
  }, [rooms]);

  return (
    <section id="salas" className="py-24 md:py-32">
      <div className="container">
        <h2 className="reveal font-display text-5xl md:text-7xl text-center text-foreground mb-16">
          Nuestras Salas
        </h2>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Cargando salas...</div>
        ) : !rooms || rooms.length === 0 ? (
          <div className="text-center text-muted-foreground">No hay salas disponibles en este momento.</div>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
              {rooms.map((room, i) => (
                <RoomCard key={room.name} room={room} delay={i + 1} onClick={() => setSelectedRoom(room)} />
              ))}
            </div>

            {/* Mobile carousel */}
            <div className="md:hidden relative">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${current * 100}%)` }}
                >
                  {rooms.map((room) => (
                    <div key={room.name} className="w-full flex-shrink-0 px-2">
                      <RoomCard room={room} delay={0} onClick={() => setSelectedRoom(room)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-6">
                <button onClick={prev} className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {rooms.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary scale-125" : "bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <button onClick={next} className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedRoom && <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
    </section>
  );
}

function RoomCard({ room, delay, onClick }: { room: any; delay: number; onClick: () => void }) {
  return (
    <div
      className={`reveal ${delay > 0 ? `reveal-delay-${delay}` : ""} group relative rounded-lg overflow-hidden border border-border bg-card transition-all duration-500 hover:border-transparent cursor-pointer`}
      onClick={onClick}
      onMouseEnter={(e) => {
        if(room.accent_color){
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${room.accent_color}40, inset 0 0 20px ${room.accent_color}08`;
          (e.currentTarget as HTMLElement).style.borderColor = `${room.accent_color}60`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "";
      }}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/5] bg-black overflow-hidden">
        <img
          src={getRoomImage(room)}
          alt={room.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent pointer-events-none" />
        {room.badge && (
          <span
            className="absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full text-white backdrop-blur-sm"
            style={{
              backgroundColor: `${room.accent_color || '#3b82f6'}80`,
              border: `1px solid ${room.accent_color || '#3b82f6'}30`,
            }}
          >
            {room.badge}
          </span>
        )}
        {room.escape_map_rank && (
          <div
            className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-sm"
            style={{ backgroundColor: `${room.accent_color}80`, border: `1px solid ${room.accent_color}40` }}
          >
            <Trophy size={12} /> N°{room.escape_map_rank}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <h3
          className="font-display text-3xl"
          style={{ color: room.accent_color || '#fff', textShadow: room.accent_color ? `0 0 20px ${room.accent_color}60` : 'none' }}
        >
          {room.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users size={14} /> {room.players}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {room.time}</span>
        </div>
        <DifficultyBar value={room.difficulty_value || 5} max={room.max_difficulty || 10} color={room.accent_color || '#E67E22'} />
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{room.description}</p>
        <span className="block text-center text-xs font-semibold text-primary transition-colors group-hover:text-white" style={{color: room.accent_color}}>CLICK PARA VER DETALLES →</span>
      </div>
    </div>
  );
}
