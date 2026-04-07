import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Users, ChevronLeft, ChevronRight, X, Trophy } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import roomRefugio from "@/assets/room-refugio.jpg";
import roomCopan from "@/assets/room-copan.png";
import roomInculpados from "@/assets/room-inculpados.jpg";
import logoEscMap from "@/assets/logo-escapemap.jpg";

const getRoomImage = (room: any) => {
  const name = room.name?.toLowerCase() || '';
  if (name.includes('refugio')) return roomRefugio;
  if (name.includes('copan')) return roomCopan;
  if (name.includes('inculpados')) return roomInculpados;
  return room.image_url || '/placeholder.svg';
};

// Ranking mapping based on user request
const getRoomRank = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes("copan")) return 3;
  if (name.includes("inculpados")) return 2;
  if (name.includes("refugio")) return 4;
  return null;
};

// ─── Difficulty bar ──────────────────────────────────────────────────────────────

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

// ─── Room Modal ──────────────────────────────────────────────────────────────────

function RoomModal({ room, onClose }: { room: any; onClose: () => void }) {
  const rank = getRoomRank(room.name);
  
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
          
          {rank && (
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none z-50 overflow-hidden">
              {/* Back fold triangle left */}
              <div 
                className="absolute top-[52px] right-[100px] w-4 h-4 rotate-[15deg] brightness-50"
                style={{ backgroundColor: '#E67E22' }}
              />
              {/* Back fold triangle right */}
              <div 
                className="absolute top-[100px] right-[16px] w-4 h-4 rotate-[75deg] brightness-50"
                style={{ backgroundColor: '#E67E22' }}
              />
              
              <div
                className="absolute top-10 right-[-45px] w-64 py-2 text-center rotate-45 shadow-2xl flex items-center justify-center gap-3 px-8 group/ribbon"
                style={{ 
                  backgroundColor: '#E67E22', 
                  clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}
              >
                <div className="bg-white p-1 rounded-sm shadow-inner shrink-0 scale-110">
                  <img src={logoEscMap} alt="" className="w-5 h-5 object-cover" />
                </div>
                <div className="flex flex-col items-start leading-none text-black font-black italic uppercase tracking-tighter">
                  <span className="text-[14px]">Puesto N°{rank}</span>
                  <span className="text-[10px] opacity-80">de la Provincia</span>
                </div>
              </div>
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

// ─── Pricing Table ───────────────────────────────────────────────────────────────

function PricingTable() {
  const tiers = [
    { range: "2 a 3 jugadores", price: "$25.000", per: "por persona" },
    { range: "4 a 6 jugadores", price: "$23.000", per: "por persona", highlight: true },
    { range: "7 a 10 jugadores", price: "$21.000", per: "por persona" },
  ];
  return (
    <div className="reveal mt-20 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm p-8 md:p-12">
      <h3 className="font-display text-4xl md:text-5xl text-center text-foreground mb-2">Precios</h3>
      <p className="text-center text-muted-foreground mb-10 text-sm">El precio varía según la cantidad de jugadores</p>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {tiers.map((t) => (
          <div
            key={t.range}
            className={`text-center p-6 rounded-xl border transition-all duration-300 ${
              t.highlight
                ? "bg-primary/15 border-primary/50 scale-105 shadow-[0_0_30px_rgba(230,126,34,0.15)]"
                : "bg-white/5 border-white/10"
            }`}
          >
            <p className="text-sm text-muted-foreground mb-2">{t.range}</p>
            <p className="font-display text-4xl md:text-5xl text-primary">{t.price}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.per}</p>
          </div>
        ))}
      </div>
      {/* Aclaraciones */}
      <div className="border-t border-white/10 pt-6 space-y-3 text-sm text-muted-foreground text-center">
        <p>🧒 De 6 a 9 años deben ingresar acompañados por al menos un adulto</p>
        <p>👶 Hasta los 5 años ingresan sin costo presentando DNI, pero no cuentan para la cantidad de jugadores</p>
      </div>
    </div>
  );
}

// ─── Room Card ───────────────────────────────────────────────────────────────────

function RoomCard({ room, delay, onClick }: { room: any; delay: number; onClick: () => void }) {
  const rank = getRoomRank(room.name);

  return (
    <div
      className={`reveal ${delay > 0 ? `reveal-delay-${delay}` : ""} group relative rounded-lg overflow-hidden border border-border bg-card transition-all duration-500 hover:border-transparent cursor-pointer`}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (room.accent_color) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${room.accent_color}40, inset 0 0 20px ${room.accent_color}08`;
          (e.currentTarget as HTMLElement).style.borderColor = `${room.accent_color}60`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "";
      }}
    >
      {/* Image — clean, no text overlay */}
      <div className="relative w-full aspect-[4/5] bg-black overflow-hidden">
        <img
          src={getRoomImage(room)}
          alt={room.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Subtle bottom fade to blend with card body */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />

        {/* Diagonal ranking ribbon — top right corner */}
        {rank && (
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none z-[20] overflow-hidden">
            {/* 3D Fold Left */}
            <div 
              className="absolute top-[44px] right-[88px] w-3 h-3 rotate-[15deg] brightness-50"
              style={{ backgroundColor: '#E67E22' }}
            />
            {/* 3D Fold Right */}
            <div 
              className="absolute top-[82px] right-[14px] w-3 h-3 rotate-[75deg] brightness-50"
              style={{ backgroundColor: '#E67E22' }}
            />

            <div
              className="absolute top-8 right-[-50px] w-64 py-1.5 text-center rotate-45 shadow-xl flex items-center justify-center gap-2 px-10"
              style={{ 
                backgroundColor: '#E67E22', 
                clipPath: 'polygon(15% 0, 85% 0, 100% 50%, 85% 100%, 15% 100%, 0 50%)'
              }}
            >
              <div className="bg-white p-0.5 rounded-sm shrink-0">
                <img src={logoEscMap} alt="" className="w-4 h-4 object-cover" />
              </div>
              <div className="flex flex-col items-start leading-none text-black font-black italic uppercase italic tracking-tighter">
                <span className="text-[12px]">Puesto N°{rank}</span>
                <span className="text-[8px] opacity-70">de la Provincia</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content below image */}
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
        <span className="block text-center text-xs font-semibold transition-colors group-hover:text-white" style={{ color: room.accent_color }}>
          VER DETALLES →
        </span>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────────

export default function RoomsSection() {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const DEFAULT_ROOMS = [
    {
      id: "fallback-1",
      name: "Ruinas de Copán",
      description: "Una expedición arqueológica que se convierte en una carrera por la supervivencia. ¿Podrán escapar de la maldición?",
      players: "2 a 6",
      time: "60 min",
      difficulty: "Alta",
      difficulty_value: 8,
      max_difficulty: 10,
      accent_color: "#f0a500",
      image_url: null,
      is_active: true,
      tagline: "Puesto N°3 en el Ranking Provincial",
      price: 15000
    },
    {
      id: "fallback-2",
      name: "Inculpados",
      description: "Has sido arrestado injustamente. Tienes una hora para encontrar las pruebas de tu inocencia antes de ser trasladado.",
      players: "2 a 6",
      time: "60 min",
      difficulty: "Media",
      difficulty_value: 6,
      max_difficulty: 10,
      accent_color: "#4A90D9",
      image_url: null,
      is_active: true,
      tagline: "Puesto N°2 en el Ranking Provincial",
      price: 15000
    },
    {
      id: "fallback-3",
      name: "El Refugio",
      description: "El mundo ha colapsado. Tu única esperanza es entrar en el refugio búnker, pero el sistema de seguridad se ha bloqueado.",
      players: "2 a 8",
      time: "60 min",
      difficulty: "Media",
      difficulty_value: 5,
      max_difficulty: 10,
      accent_color: "#27AE60",
      image_url: null,
      is_active: true,
      tagline: "Puesto N°4 en el Ranking Provincial",
      price: 15000
    }
  ];

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['public-rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('*').order('sort_order', { ascending: true });
      return data || [];
    }
  });

  const rooms = roomsData && roomsData.length > 0 ? roomsData : DEFAULT_ROOMS;


  return (
    <section id="salas" className="py-24 md:py-32">
      <div className="container">
        <header className="mb-16 md:mb-24">
          <h2 className="reveal font-display text-5xl md:text-7xl text-center text-foreground mb-4">
            Nuestras Salas
          </h2>
          <div className="reveal reveal-delay-1 h-1.5 w-24 bg-primary mx-auto rounded-full shadow-[0_0_15px_rgba(230,126,34,0.5)]" />
        </header>

        {/* Room cards grid */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            Cargando salas...
          </div>
        ) : !rooms || rooms.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 bg-card rounded-xl border border-dashed border-border">
            No hay salas disponibles en este momento.
          </div>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
              {rooms.map((room, i) => (
                <RoomCard key={room.name} room={room} delay={i + 1} onClick={() => setSelectedRoom(room)} />
              ))}
            </div>

            {/* Mobile carousel with Embla */}
            <div className="md:hidden relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {rooms.map((room) => (
                    <div key={room.name} className="flex-[0_0_100%] min-w-0 px-2 lg:px-4">
                      <div className="active-tap">
                        <RoomCard room={room} delay={0} onClick={() => setSelectedRoom(room)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button 
                  onClick={prev} 
                  className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground transition-all bg-card active:scale-90 shadow-sm"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div className="flex gap-2.5">
                  {rooms.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollTo(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === selectedIndex ? "w-8 bg-primary shadow-[0_0_10px_rgba(230,126,34,0.5)]" : "w-2 bg-muted-foreground/30"}`}
                      aria-label={`Ver sala ${i + 1}`}
                    />
                  ))}
                </div>
                
                <button 
                  onClick={next} 
                  className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground transition-all bg-card active:scale-90 shadow-sm"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Pricing table */}
        <PricingTable />
      </div>

      {selectedRoom && <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
    </section>
  );
}
