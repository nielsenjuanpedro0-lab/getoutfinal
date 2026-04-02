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

type Room = { id: string; name: string; players: string | null; accent_color: string | null; image_url: string | null };
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

  // Load rooms
  useEffect(() => {
    supabase
      .from("rooms")
      .select("id, name, players, accent_color, image_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setRooms(data); });
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
    <section id="reservar" className="relative py-24 md:py-32 overflow-hidden">
      
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000 blur-[150px]"
        style={{ backgroundColor: selectedRoom ? roomColor : 'transparent' }}
      />
      
      <div className="container max-w-5xl relative z-10">
        <h2 className="reveal font-display text-6xl md:text-8xl text-center text-white mb-6 drop-shadow-2xl">
          Reservá tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">aventura</span>
        </h2>

        {/* Progress */}
        {step !== "success" && (
          <div className="flex items-center justify-center gap-3 mb-12">
            {(["room", "datetime", "details"] as Step[]).map((s, i) => {
              const stepOrder = ["room", "datetime", "details"];
              const current = stepOrder.indexOf(step);
              return (
                <div key={s} className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-lg"
                    style={{
                      backgroundColor: current === i ? roomColor : current > i ? `${roomColor}30` : '#27272a',
                      color: current === i ? '#fff' : current > i ? roomColor : '#71717a',
                      boxShadow: current === i ? `0 0 20px ${roomColor}50` : 'none',
                      border: current === i ? 'none' : `1px solid ${current > i ? roomColor : '#3f3f46'}`
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && <div className="w-12 h-px" style={{ backgroundColor: current > i ? roomColor : '#3f3f46', transition: 'background-color 0.5s' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Room */}
        {step === "room" && (
          <div className="reveal">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRoom(r.id); setStep("datetime"); }}
                  className="group relative overflow-hidden rounded-2xl bg-zinc-950 text-left transition-all duration-500 hover:-translate-y-2 aspect-video sm:aspect-[4/5] shadow-xl"
                  style={{ border: `1px solid ${r.accent_color || '#3f3f46'}40` }}
                >
                  <img src={getRoomImage(r)} alt={r.name} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  
                  <div className="absolute bottom-0 inset-x-0 p-6 z-10">
                    <h4 
                      className="font-display text-4xl text-white mb-1 transition-all duration-300 drop-shadow-md"
                      style={{textShadow: `0 0 30px ${r.accent_color || '#e67e22'}`}}
                    >
                      {r.name}
                    </h4>
                  </div>
                  
                  {/* Hover Border Glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" 
                    style={{boxShadow: `inset 0 0 30px ${r.accent_color || '#e67e22'}40`, border: `2px solid ${r.accent_color || '#e67e22'}`}} 
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
          <div className="reveal max-w-4xl mx-auto">
            <div 
              className="relative p-8 md:p-12 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border transition-all duration-500" 
              style={{borderColor: `${roomColor}30`, boxShadow: `0 20px 60px -15px ${roomColor}20`}}
            >
              <button
                onClick={() => { setStep("room"); setSelectedDate(undefined); setSelectedTime(""); }}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver a salas
              </button>
              
              <div className="text-center mb-10">
                <span className="text-sm font-bold tracking-widest uppercase mb-2 inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10" style={{color: roomColor}}>
                  {room?.name}
                </span>
                <h3 className="font-display text-4xl text-white mt-4">Elegí fecha y horario</h3>
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
                    <div className="flex flex-col items-center justify-center py-16 text-sm text-zinc-400 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin" style={{color: roomColor}} />
                      Buscando disponibilidad...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-red-950/20 border border-red-500/20">
                      <p className="text-sm text-red-400 text-center">
                        No hay turnos disponibles para esta fecha. Probá otro día.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white mb-4 text-center capitalize">
                        {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {roomSlots.map((slot) => {
                          const isAvailable = availableSlots.includes(slot);
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setSelectedTime(slot)}
                              className={`py-4 px-2 rounded-xl text-lg font-bold transition-all duration-300 border ${
                                isSelected
                                  ? "text-white scale-105"
                                  : isAvailable
                                  ? "bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800"
                                  : "bg-black/50 border-white/5 text-zinc-600 line-through cursor-not-allowed"
                              }`}
                              style={isSelected ? { backgroundColor: roomColor, borderColor: roomColor, boxShadow: `0 0 20px ${roomColor}50` } : {}}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </>
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
          <div className="reveal max-w-2xl mx-auto">
            <div 
              className="relative p-8 md:p-12 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border transition-all duration-500" 
              style={{borderColor: `${roomColor}30`, boxShadow: `0 20px 60px -15px ${roomColor}20`}}
            >
              <button
                onClick={() => setStep("datetime")}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver atrás
              </button>
              
              <div className="text-center mb-10">
                <span className="text-sm font-bold tracking-widest uppercase mb-2 inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10" style={{color: roomColor}}>
                  {room?.name} · {selectedDate && format(selectedDate, "d/MM/yyyy")} · {selectedTime} HS
                </span>
                <h3 className="font-display text-4xl text-white mt-4">Completá tu reserva</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Nombre del capitán *</label>
                  <input
                    type="text" required value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-shadow"
                    style={{ '--tw-ring-color': roomColor } as any}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-1.5 block">WhatsApp *</label>
                    <input
                      type="tel" required value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-shadow"
                      style={{ '--tw-ring-color': roomColor } as any}
                      placeholder="+54 9 2262 ..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Email (opcional)</label>
                    <input
                      type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-shadow"
                      style={{ '--tw-ring-color': roomColor } as any}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Reservation info */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Valor de la reserva</span>
                    <span className="text-white font-bold text-lg">$15.000</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    Llegar 15 minutos antes del horario elegido
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full mt-4 text-white font-bold py-5 rounded-xl text-lg hover:brightness-110 active:scale-[0.97] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
                  style={{backgroundColor: roomColor, boxShadow: `0 0 25px ${roomColor}40`}}
                >
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> PROCESANDO...</>) : "CONFIRMAR Y PAGAR →"}
                </button>
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
