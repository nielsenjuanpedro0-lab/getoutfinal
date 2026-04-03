import { useState, useEffect, useMemo } from "react";
import { MapPin, Loader2, CheckCircle, ChevronLeft, ChevronRight, CalendarDays, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isBefore, startOfDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import roomRefugio from "@/assets/room-refugio.jpg";
import roomCopan from "@/assets/room-copan.jpg";
import roomInculpados from "@/assets/room-inculpados.jpg";

// ⚠️ Reemplazá esta URL por tu link de cobro de Mercado Pago:
// Crealo en: mercadopago.com.ar → Cobrar → Crear link de cobro → $15.000
const MP_PAYMENT_URL = "https://mpago.la/XXXXXXXXX";

type Room = { id: string; name: string; players: string | null; accent_color: string | null; image_url: string | null; price?: number | null };
type Step = "room" | "datetime" | "details" | "success";

const getRoomImage = (room: any) => {
  if (room.image_url && room.image_url !== '/placeholder.svg' && room.image_url !== '') return room.image_url;
  const name = room.name?.toLowerCase() || '';
  if (name.includes('refugio')) return roomRefugio;
  if (name.includes('copan')) return roomCopan;
  if (name.includes('inculpados')) return roomInculpados;
  return '/placeholder.svg';
};

export default function ContactSection() {
  const [step, setStep] = useState<Step>("room");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [roomSlots, setRoomSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", whatsapp: "", email: "" });

  const room = useMemo(() => rooms.find((r) => r.id === selectedRoom), [rooms, selectedRoom]);
  const roomColor = room?.accent_color || "hsl(var(--primary))";

  const DEFAULT_ROOMS: Room[] = [
    {
      id: "fallback-1",
      name: "Ruinas de Copán",
      players: "2 a 6",
      accent_color: "#f0a500",
      image_url: null,
      price: 15000
    },
    {
      id: "fallback-2",
      name: "Inculpados",
      players: "2 a 6",
      accent_color: "#4A90D9",
      image_url: null,
      price: 15000
    },
    {
      id: "fallback-3",
      name: "El Refugio",
      players: "2 a 8",
      accent_color: "#27AE60",
      image_url: null,
      price: 15000
    }
  ];

  // Load rooms
  useEffect(() => {
    supabase
      .from("rooms")
      .select("*")
      .order("sort_order")
      .then(({ data }) => { 
        if (data && data.length > 0) {
          setRooms(data as any); 
        } else {
          setRooms(DEFAULT_ROOMS);
        }
      });
  }, []);

  // Load room-specific time slots
  useEffect(() => {
    if (!selectedRoom) { setRoomSlots([]); return; }
    supabase
      .from("room_time_slots")
      .select("time_slot")
      .eq("room_id", selectedRoom)
      .order("time_slot")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRoomSlots(data.map((d) => d.time_slot.slice(0, 5)));
        } else {
          const roomName = rooms.find((r) => r.id === selectedRoom)?.name?.toLowerCase() || "";
          if (roomName.includes("copan")) {
            setRoomSlots(["16:15", "17:30", "18:45", "20:00"]);
          } else if (roomName.includes("inculpados")) {
            setRoomSlots(["17:00", "18:15", "19:30", "20:45"]);
          } else if (roomName.includes("refugio")) {
            setRoomSlots(["16:30", "17:45", "19:00", "20:15"]);
          } else {
            setRoomSlots(["16:00", "18:00", "20:00", "22:00"]);
          }
        }
      });
  }, [selectedRoom, rooms]);

  // Check availability
  useEffect(() => {
    if (!selectedRoom || !selectedDate || roomSlots.length === 0) {
      setAvailableSlots(roomSlots);
      return;
    }
    const fetchAvailability = async () => {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const [bookingsRes, blockedRes] = await Promise.all([
        supabase.from("bookings").select("booking_time").eq("room_id", selectedRoom).eq("booking_date", dateStr).neq("status", "cancelled"),
        supabase.from("blocked_slots").select("blocked_time").eq("room_id", selectedRoom).eq("blocked_date", dateStr),
      ]);
      const taken = new Set<string>();
      bookingsRes.data?.forEach((b) => taken.add(b.booking_time.slice(0, 5)));
      blockedRes.data?.forEach((b) => taken.add(b.blocked_time.slice(0, 5)));
      setAvailableSlots(roomSlots.filter((t) => !taken.has(t)));
      setLoadingSlots(false);
      if (selectedTime && taken.has(selectedTime)) setSelectedTime("");
    };
    fetchAvailability();
  }, [selectedRoom, selectedDate, roomSlots]);

  // Only allow weekends
  const disableDate = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const day = getDay(date);
    return day !== 0 && day !== 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedDate || !selectedTime) return;
    setLoading(true);

    const { error } = await supabase.from("bookings").insert({
      customer_name: formData.nombre,
      customer_phone: formData.whatsapp,
      customer_email: formData.email || null,
      room_id: selectedRoom,
      num_players: 2, // default, removed from form
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      notes: null,
      status: "pending",
      payment_status: "unpaid",
    });

    if (error) {
      toast.error("Error al procesar la reserva. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    // Redirect to Mercado Pago payment link
    window.location.href = MP_PAYMENT_URL;
  };

  const resetForm = () => {
    setStep("room");
    setSelectedRoom(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setFormData({ nombre: "", whatsapp: "", email: "" });
  };

  return (
    <section id="reservar" className="relative py-12 md:py-32 overflow-hidden px-4 sm:px-6">
      
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000 blur-[150px]"
        style={{ backgroundColor: selectedRoom ? roomColor : 'transparent' }}
      />
      
      <div className="container max-w-5xl relative z-10 px-0">
        <h2 className="reveal font-display text-4xl sm:text-6xl md:text-8xl text-center text-white mb-6 drop-shadow-2xl px-2">
          Reservá tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">aventura</span>
        </h2>

        {/* Progress */}
        {step !== "success" && (
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-10 md:mb-16">
            {(["room", "datetime", "details"] as Step[]).map((s, i) => {
              const stepOrder = ["room", "datetime", "details"];
              const currentIdx = stepOrder.indexOf(step);
              const isCompleted = currentIdx > i;
              const isActive = currentIdx === i;
              
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-500 ${isActive ? 'animate-pulse-glow' : ''}`}
                      style={{
                        backgroundColor: isActive ? roomColor : isCompleted ? `${roomColor}20` : '#18181b',
                        color: isActive ? '#fff' : isCompleted ? roomColor : '#52525b',
                        boxShadow: isActive ? `0 0 25px ${roomColor}60` : 'none',
                        border: `2px solid ${isActive || isCompleted ? roomColor : '#27272a'}`
                      }}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : i + 1}
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="w-8 sm:w-16 md:w-24 h-[2px] mx-1 md:mx-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-700 ease-in-out" 
                        style={{ 
                          width: isCompleted ? '100%' : '0%', 
                          backgroundColor: roomColor,
                          boxShadow: isCompleted ? `0 0 10px ${roomColor}` : 'none'
                        }} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Room */}
        {step === "room" && (
          <div key="step-room" className="animate-slide-in-right px-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRoom(r.id); setTimeout(() => setStep("datetime"), 50); }}
                  className="group relative overflow-hidden rounded-3xl bg-zinc-950 text-left transition-all duration-500 hover:-translate-y-2 aspect-[2.4/1] sm:aspect-[4/5] shadow-2xl active:scale-[0.98]"
                  style={{ border: `1px solid ${r.accent_color || '#3f3f46'}30` }}
                >
                  <img src={getRoomImage(r)} alt={r.name} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  <div className="absolute bottom-0 inset-x-0 p-5 md:p-8 z-10">
                    <h4 
                      className="font-display text-3xl md:text-5xl text-white mb-1 transition-all duration-500 drop-shadow-md group-hover:translate-x-2"
                      style={{textShadow: `0 0 40px ${r.accent_color || '#e67e22'}80`}}
                    >
                      {r.name}
                    </h4>
                    <div className="w-0 group-hover:w-16 h-1 rounded-full transition-all duration-500 mt-2" style={{backgroundColor: r.accent_color}} />
                  </div>
                  
                  {/* Hover Border Glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl" 
                    style={{boxShadow: `inset 0 0 50px ${r.accent_color || '#e67e22'}30`, border: `2px solid ${r.accent_color || '#e67e22'}80`}} 
                  />
                </button>
              ))}
            </div>

            {/* WhatsApp button for pre-questions */}
            <div className="text-center mt-10">
              <a
                href="https://wa.me/5492262000000?text=Hola!%20Tengo%20algunas%20preguntas%20antes%20de%20reservar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 text-zinc-300 font-medium px-6 py-3 rounded-xl hover:border-white/50 hover:text-white transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                ¿Tenés preguntas? Escribinos antes de reservar
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === "datetime" && (
          <div key="step-datetime" className="animate-slide-in-right max-w-4xl mx-auto px-2">
            <div 
              className="relative p-6 md:p-12 rounded-[2.5rem] glass-panel transition-all duration-500 overflow-hidden" 
              style={{borderColor: `${roomColor}40`, boxShadow: `0 30px 100px -20px ${roomColor}15`}}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.02] blur-3xl -mr-32 -mt-32 rounded-full" />
              
              <button
                onClick={() => { setStep("room"); setSelectedDate(undefined); setSelectedTime(""); }}
                className="group flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-all hover:-translate-x-1"
              >
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                Volver a salas
              </button>
              
              <div className="text-center mb-10">
                <span className="text-xs md:text-sm font-bold tracking-widest uppercase mb-2 inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10" style={{color: roomColor}}>
                  {room?.name}
                </span>
                <h3 className="font-display text-3xl md:text-4xl text-white mt-2 md:mt-4">Elegí fecha y horario</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/5 shadow-inner">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); }}
                      disabled={disableDate}
                      locale={es}
                      className="pointer-events-auto"
                      style={{ '--theme-color': roomColor } as any}
                    />
                  </div>
                </div>

                <div>
                  {!selectedDate ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-black/30 border border-white/5 border-dashed">
                      <CalendarDays className="w-10 h-10 text-zinc-600 mb-4" />
                      <p className="text-zinc-400 text-sm text-center">
                        Seleccioná una fecha en el calendario (sábados y domingos).
                      </p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" style={{borderColor: roomColor}} />
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white/5" />
                      </div>
                      <p className="text-sm text-zinc-400 font-medium animate-pulse">Consultando disponibilidad...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-3xl bg-red-950/10 border border-red-500/20 backdrop-blur-sm animate-fade-in-up">
                      <p className="text-sm text-red-300 text-center font-medium">
                        No hay turnos hoy. <br/>¿Buscamos otro día?
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fade-in-up">
                      <p className="text-xs font-bold tracking-[0.2em] text-zinc-500 mb-6 text-center uppercase">
                        Horarios Disponibles
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        {roomSlots.map((slot) => {
                          const isAvailable = availableSlots.includes(slot);
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => { 
                                setSelectedTime(slot); 
                                setTimeout(() => setStep("details"), 400); 
                              }}
                              className={`py-5 px-2 rounded-2xl text-xl font-bold transition-all duration-300 border shadow-sm active:scale-90 ${
                                isSelected
                                  ? "text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] z-10"
                                  : isAvailable
                                  ? "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                                  : "bg-black/40 border-white/0 text-zinc-700 line-through cursor-not-allowed"
                              }`}
                              style={isSelected ? { backgroundColor: roomColor, borderColor: roomColor, boxShadow: `0 0 30px ${roomColor}40` } : {}}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedTime && (
                    <button
                      onClick={() => setStep("details")}
                      className="w-full mt-8 text-white font-bold py-5 rounded-xl text-lg hover:brightness-110 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                      style={{backgroundColor: roomColor, boxShadow: `0 0 25px ${roomColor}40`}}
                    >
                      Continuar <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === "details" && (
          <div key="step-details" className="animate-slide-in-right max-w-2xl mx-auto px-2">
            <div 
              className="relative p-7 md:p-14 rounded-[2.5rem] glass-panel transition-all duration-500" 
              style={{borderColor: `${roomColor}40`, boxShadow: `0 30px 100px -20px ${roomColor}15`}}
            >
              <button
                onClick={() => setStep("datetime")}
                className="group flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-all hover:-translate-x-1"
              >
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                Elegir otro horario
              </button>
              
              <div className="text-center mb-10">
                <span className="text-[10px] md:text-sm font-black tracking-[0.25em] uppercase mb-4 inline-block px-5 py-2 rounded-full bg-white/5 border border-white/10" style={{color: roomColor}}>
                  {room?.name} · {selectedTime} HS
                </span>
                <h3 className="font-display text-4xl md:text-6xl text-white mt-2">DATOS DEL EQUIPO</h3>
                <p className="text-zinc-500 text-xs md:text-sm mt-4 max-w-md mx-auto">
                  Completá para procesar la reserva.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase ml-1">Capitán *</label>
                    <input
                      type="text" required value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder:text-zinc-700 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': `${roomColor}40` } as any}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase ml-1">WhatsApp *</label>
                    <input
                      type="tel" required value={formData.whatsapp}
                      inputMode="tel"
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder:text-zinc-700 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': `${roomColor}40` } as any}
                      placeholder="+54 2262 ..."
                    />
                  </div>
                </div>
                {/* Email (opcional) centered/full on mobile */}
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase ml-1">Email (Opcional)</label>
                  <input
                    type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder:text-zinc-700 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': `${roomColor}40` } as any}
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Reservation info summary - Re-organized for clarity */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-4 mt-8 shadow-inner overflow-hidden relative">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-zinc-400 font-bold tracking-widest uppercase text-xs">Valor de la seña</span>
                    <span className="text-white font-black text-3xl" style={{textShadow: `0 0 30px ${roomColor}80`}}>
                      $15.000
                    </span>
                  </div>
                  
                  <div className="h-px bg-white/5 w-full" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0" style={{backgroundColor: `${roomColor}20`, color: roomColor}}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      Abonando esta seña asegurás tu turno.
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0" style={{backgroundColor: `${roomColor}20`, color: roomColor}}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      El resto se abona en el búnker.
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit" disabled={loading}
                    className="w-full text-white font-black py-7 rounded-[2rem] text-xl hover:brightness-110 active:scale-[0.98] transition-all duration-500 disabled:opacity-60 flex flex-col items-center justify-center gap-1 shadow-2xl relative overflow-hidden group"
                    style={{backgroundColor: roomColor, boxShadow: `0 25px 60px -15px ${roomColor}80`}}
                  >
                    <span className="relative z-10 uppercase tracking-[0.2em]">
                      {loading ? "PROCESANDO..." : "CONFIRMAR Y PAGAR SEÑA"}
                    </span>
                    <span className="relative z-10 text-[10px] opacity-70 tracking-widest font-bold">
                      REDirección segura a MERCADO PAGO
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success (fallback if redirect fails) */}
        {step === "success" && (
          <div className="reveal flex flex-col items-center justify-center text-center space-y-6 p-12 md:p-16 rounded-3xl border bg-black/50 backdrop-blur-xl max-w-2xl mx-auto"
               style={{borderColor: `${roomColor}30`, boxShadow: `0 0 100px ${roomColor}10`}}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center border-4" style={{borderColor: roomColor, backgroundColor: `${roomColor}20`}}>
              <CheckCircle className="w-12 h-12" style={{color: roomColor}} />
            </div>
            <h3 className="font-display text-5xl text-white drop-shadow-lg">¡RESERVA REGISTRADA!</h3>
            <button 
              onClick={resetForm} 
              className="mt-6 border font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:brightness-110"
              style={{borderColor: roomColor, color: roomColor, backgroundColor: `${roomColor}10`}}
            >
              NUEVA RESERVA
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
