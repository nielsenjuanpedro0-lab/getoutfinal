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

  // Fast animation settings
  const fastTransition: any = { duration: 0.3, ease: [0.23, 1, 0.32, 1] };

  const DEFAULT_ROOMS: Room[] = [
    { id: "fallback-1", name: "Ruinas de Copán", players: "2 a 6", accent_color: "#f0a500", image_url: null, price: 15000 },
    { id: "fallback-2", name: "Inculpados", players: "2 a 6", accent_color: "#4A90D9", image_url: null, price: 15000 },
    { id: "fallback-3", name: "El Refugio", players: "2 a 8", accent_color: "#27AE60", image_url: null, price: 15000 }
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
      return null;
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

    const paymentUrl = await createMPPreference(bookingData.id, room?.name || "Sala de Escape", 15000);
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
    <section id="reservar" className="relative py-12 md:py-24 overflow-hidden px-4">
      {/* Background Polish - Simplified for performance */}
      <div 
        className="absolute inset-x-0 -top-20 bottom-0 opacity-[0.03] pointer-events-none transition-colors duration-500 blur-[100px]"
        style={{ backgroundColor: roomColor }}
      />

      <div className="container max-w-3xl relative z-10 px-0">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="font-display text-4xl sm:text-7xl text-white mb-2">
            Reservá tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">misión</span>
          </h2>
          <div className="h-1 w-16 bg-primary mx-auto rounded-full" style={{ backgroundColor: roomColor }} />
        </motion.div>

        {/* Liquid Step Transitions - High Speed */}
        <AnimatePresence mode="wait">
          {step === "room" && (
            <motion.div
              key="step-room"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={fastTransition}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            >
              {rooms.map((r) => (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelectedRoom(r.id); setStep("datetime"); }}
                  className="group relative h-40 sm:h-72 rounded-2xl overflow-hidden border border-white/5 bg-zinc-950 transition-colors hover:border-white/20"
                >
                  <img src={getRoomImage(r)} alt={r.name} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-left">
                    <h4 className="font-display text-2xl text-white">{r.name}</h4>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{r.players} jugadores</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/5 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                    Elegir
                  </div>
                </motion.button>
              ))}
              <div className="md:col-span-3 text-center opacity-60 hover:opacity-100 transition-opacity">
                 <a href="https://wa.me/5492262314212" target="_blank" className="text-zinc-500 hover:text-white text-xs flex items-center justify-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-green-500" /> ¿Dudas? WhatsApp
                 </a>
              </div>
            </motion.div>
          )}

          {step === "datetime" && (
            <motion.div
              key="step-datetime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={fastTransition}
              className="max-w-2xl mx-auto bg-zinc-950/40 backdrop-blur-lg border border-white/10 rounded-[2rem] p-5 md:p-8"
            >
              <button 
                onClick={() => setStep("room")}
                className="mb-6 flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Volver
              </button>

              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-4">
                  <h3 className="font-display text-2xl text-white">1. Fecha</h3>
                  <div className="p-2 sm:p-3 bg-black/40 border border-white/5 rounded-xl">
                    <Calendar 
                      mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); }}
                      disabled={disableDate} locale={es}
                      className="rounded-xl scale-[0.9] sm:scale-100 origin-top"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col">
                  <h3 className="font-display text-2xl text-white">2. Horario</h3>
                  {!selectedDate ? (
                     <div className="flex-1 flex items-center justify-center border border-white/5 border-dashed rounded-xl p-8 text-zinc-700 text-xs italic text-center">
                        Seleccioná un día
                     </div>
                  ) : loadingSlots ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-zinc-600" /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {availableSlots.length > 0 ? availableSlots.map(s => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedTime(s); setTimeout(() => setStep("details"), 200); }}
                          className={`py-3.5 rounded-xl font-black text-lg transition-all ${selectedTime === s ? 'text-white shadow-lg' : 'bg-white/5 text-white/30'}`}
                          style={selectedTime === s ? { backgroundColor: roomColor } : {}}
                        >
                          {s}
                        </motion.button>
                      )) : <p className="col-span-2 text-zinc-600 text-[10px] italic text-center mt-8">Sin turnos disponibles</p>}
                    </div>
                  )}
                  {selectedTime && (
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep("details")}
                      className="mt-6 w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-xl brightness-110 active:brightness-90 transition-all"
                      style={{ backgroundColor: roomColor }}
                    >
                      Continuar <ArrowRight className="inline ml-1.5 w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="step-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={fastTransition}
              className="max-w-xl mx-auto bg-zinc-950/40 backdrop-blur-lg border border-white/10 rounded-[2rem] p-6 md:p-8"
            >
              <button 
                onClick={() => setStep("datetime")}
                className="mb-6 flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Otro horario
              </button>

              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-3xl text-white uppercase leading-none">{room?.name}</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-tight text-[10px] mt-1.5 opacity-70">
                    {format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })} · {selectedTime} HS
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full border border-white/5 flex items-center justify-center" style={{ color: roomColor }}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Capitán</label>
                      <input 
                        type="text" required value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                        placeholder="Tu nombre"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">WhatsApp</label>
                      <input 
                        type="tel" required value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                        placeholder="2262 ..."
                      />
                   </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Valor de seña</span>
                    <span className="text-2xl font-black text-white" style={{ textShadow: `0 0 20px ${roomColor}40` }}>$15.000</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-semibold italic">
                    <CheckCircle className="w-3 h-3 text-green-500/50" /> El resto se abona en el local
                  </div>
                </div>

                <motion.button
                  type="submit" disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-5 rounded-2xl text-white font-black text-base shadow-2xl brightness-110 flex flex-col items-center justify-center gap-0.5"
                  style={{ backgroundColor: roomColor, boxShadow: `0 15px 30px -10px ${roomColor}60` }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <span className="flex items-center gap-2"><Wallet className="w-5 h-5" /> PAGAR SEÑA</span>
                      <span className="text-[9px] opacity-50 uppercase tracking-[0.15em] font-normal">Vía Mercado Pago</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={fastTransition}
              className="max-w-md mx-auto text-center space-y-6 py-16"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="font-display text-4xl text-white uppercase">RESERVA LISTA</h3>
              <p className="text-zinc-500 text-sm">Aguardá unos segundos...</p>
              <button 
                onClick={resetForm}
                className="bg-white/5 border border-white/10 px-8 py-3 rounded-xl text-zinc-400 text-xs transition-all"
              >
                Volver
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
