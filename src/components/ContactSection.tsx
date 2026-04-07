import { useState, useEffect, useMemo } from "react";
import { MapPin, Loader2, CheckCircle, ChevronLeft, ChevronRight, CalendarDays, MessageCircle, ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isBefore, startOfDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import roomRefugio from "@/assets/room-refugio.jpg";
import roomCopan from "@/assets/room-copan.png";
import roomInculpados from "@/assets/room-inculpados.jpg";

type Room = { id: string; name: string; players: string | null; accent_color: string | null; image_url: string | null; price?: number | null };
type Step = "room" | "datetime" | "details" | "success";

const getRoomImage = (room: any) => {
  const hasRealImage = room.image_url && 
                       !room.image_url.includes('placeholder') && 
                       room.image_url !== '' && 
                       room.image_url !== '/placeholder.svg';

  if (hasRealImage) return room.image_url;

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

  useEffect(() => {
    supabase.from("rooms").select("*").order("sort_order").then(({ data }) => { 
      if (data && data.length > 0) setRooms(data as any); 
      else setRooms(DEFAULT_ROOMS);
    });
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    supabase.from("room_time_slots").select("time_slot").eq("room_id", selectedRoom).order("time_slot").then(({ data }) => {
      if (data && data.length > 0) {
        setRoomSlots(data.map((d) => d.time_slot.slice(0, 5)));
      } else {
        const roomName = room?.name?.toLowerCase() || "";
        if (roomName.includes("copan")) setRoomSlots(["16:15", "17:30", "18:45", "20:00"]);
        else if (roomName.includes("inculpados")) setRoomSlots(["17:00", "18:15", "19:30", "20:45"]);
        else if (roomName.includes("refugio")) setRoomSlots(["16:30", "17:45", "19:00", "20:15"]);
        else setRoomSlots(["16:00", "18:00", "20:00", "22:00"]);
      }
    });
  }, [selectedRoom]);

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
    };
    fetchAvailability();
  }, [selectedRoom, selectedDate, roomSlots]);

  const disableDate = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const day = getDay(date);
    return day !== 0 && day !== 6;
  };

  const createMPPreference = async (bookingId: string, roomName: string, price: number) => {
    try {
      // Calling the new Vercel Serverless Function to avoid CORS
      const response = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, roomName, price }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create preference');
      return data.init_point;
    } catch (err) {
      console.error("Error creating MP preference:", err);
      // Fallback to Edge Function if Vercel API is not ready (unlikely but safe)
      try {
        const { data } = await supabase.functions.invoke('mercadopago', {
          body: { bookingId, roomName, price },
        });
        return data?.init_point;
      } catch {
        return null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedDate || !selectedTime) return;
    setLoading(true);

    const { data: bookingData, error } = await supabase.from("bookings").insert({
      customer_name: formData.nombre,
      customer_phone: formData.whatsapp,
      customer_email: formData.email || null,
      room_id: selectedRoom,
      num_players: 2,
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      status: "pending",
      payment_status: "unpaid",
    }).select().single();

    if (error || !bookingData) {
      toast.error("Error al procesar la reserva.");
      setLoading(false);
      return;
    }

    const paymentUrl = await createMPPreference(bookingData.id, room?.name || "Sala de Escape", room?.price || 15000);
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      toast.error("Error al generar el pago. Por favor contactanos.");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("room");
    setSelectedRoom(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setFormData({ nombre: "", whatsapp: "", email: "" });
  };

  return (
    <section id="reservar" className="relative py-12 md:py-32 overflow-hidden px-4">
      {/* Background Polish */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none transition-colors duration-1000 blur-[150px]"
        style={{ backgroundColor: roomColor }}
      />

      <div className="container max-w-4xl relative z-10 px-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl sm:text-7xl text-white mb-4">
            Reservá tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">misión</span>
          </h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" style={{ backgroundColor: roomColor }} />
        </motion.div>

        {/* Liquid Step Transitions */}
        <AnimatePresence mode="wait">
          {step === "room" && (
            <motion.div
              key="step-room"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRoom(r.id); setStep("datetime"); }}
                  className="group relative h-48 sm:h-80 rounded-3xl overflow-hidden border border-white/10 transition-all hover:border-white/30"
                >
                  <img src={getRoomImage(r)} alt={r.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-left">
                    <h4 className="font-display text-3xl text-white drop-shadow-lg">{r.name}</h4>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{r.players} jugadores</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    SELECCIONAR
                  </div>
                </button>
              ))}
              <div className="md:col-span-3 text-center mt-4">
                 <a href="https://wa.me/5492262314212" target="_blank" className="text-zinc-500 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" /> ¿Tenés dudas? Escribinos por WhatsApp
                 </a>
              </div>
            </motion.div>
          )}

          {step === "datetime" && (
            <motion.div
              key="step-datetime"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-3xl mx-auto bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl"
            >
              <button 
                onClick={() => setStep("room")}
                className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" /> Cambiar sala
              </button>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-display text-3xl text-white">Elegir Fecha</h3>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                    <Calendar 
                      mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); }}
                      disabled={disableDate} locale={es}
                      className="rounded-xl"
                    />
                  </div>
                  <p className="text-yellow-500/80 text-[10px] font-bold uppercase italic">* Solo fines de semana</p>
                </div>

                <div className="space-y-6">
                  <h3 className="font-display text-3xl text-white">Horario</h3>
                  {!selectedDate ? (
                     <div className="h-48 border border-white/5 border-dashed rounded-2xl flex flex-center items-center justify-center text-zinc-600 text-sm italic">
                        Seleccioná un día primero
                     </div>
                  ) : loadingSlots ? (
                    <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {availableSlots.length > 0 ? availableSlots.map(s => (
                        <button
                          key={s}
                          onClick={() => { setSelectedTime(s); setTimeout(() => setStep("details"), 300); }}
                          className={`py-4 rounded-xl font-black text-xl transition-all ${selectedTime === s ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                          style={selectedTime === s ? { backgroundColor: roomColor } : {}}
                        >
                          {s}
                        </button>
                      )) : <p className="col-span-2 text-zinc-600 italic">No hay turnos disponibles hoy</p>}
                    </div>
                  )}
                  {selectedTime && (
                    <button 
                      onClick={() => setStep("details")}
                      className="w-full py-5 rounded-2xl text-white font-black text-lg shadow-xl shadow-primary/20 hover:brightness-110 transition-all"
                      style={{ backgroundColor: roomColor }}
                    >
                      CONTINUAR <ArrowRight className="inline ml-2 w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="step-details"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, opacity: 0 }}
              className="max-w-2xl mx-auto bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
            >
              <button 
                onClick={() => setStep("datetime")}
                className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" /> Ver otros horarios
              </button>

              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-4xl text-white uppercase">{room?.name}</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-tighter text-sm mt-1">
                    {format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })} · {selectedTime} HS
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center text-primary" style={{ color: roomColor }}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Nombre del Capitán</label>
                      <input 
                        type="text" required value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 transition-all"
                        style={{'--tw-ring-color': roomColor} as any}
                        placeholder="Ej: Juan Pérez"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">WhatsApp de contacto</label>
                      <input 
                        type="tel" required value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 transition-all"
                        style={{'--tw-ring-color': roomColor} as any}
                        placeholder="2262 123456"
                      />
                   </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Reserva y Seña</span>
                    <span className="text-3xl font-black text-white" style={{ textShadow: `0 0 30px ${roomColor}60` }}>${(room?.price || 15000).toLocaleString('es-AR')}</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-zinc-500 font-medium">
                    <li className="flex items-center gap-2 text-green-500/80"><CheckCircle className="w-3 h-3" /> Turno asegurado al abonar</li>
                    <li className="flex items-center gap-2"><MapPin className="w-3 h-3" /> El restando se abona en efectivo en el local</li>
                  </ul>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-6 rounded-[2rem] text-white font-black text-xl relative overflow-hidden group shadow-2xl transition-transform active:scale-95"
                  style={{ backgroundColor: roomColor, boxShadow: `0 20px 50px -15px ${roomColor}80` }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : <><Wallet className="w-6 h-6" /> PAGAR SEÑA AHORA</>}
                  </span>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto text-center space-y-8 py-20"
            >
              <div className="w-24 h-24 rounded-full border-2 border-green-500 mx-auto flex items-center justify-center">
                 <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="font-display text-6xl text-white uppercase">RESERVA LISTA</h3>
              <p className="text-zinc-400">Te redirigimos al pago o contactaremos pronto.</p>
              <button 
                onClick={resetForm}
                className="bg-white/5 border border-white/10 hover:border-white/30 px-10 py-4 rounded-xl text-zinc-300 transition-all"
              >
                Volver al inicio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
