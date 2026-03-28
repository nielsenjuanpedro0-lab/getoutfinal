import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Ban, Check, X, Trash2, Calendar as CalendarIcon, List, DollarSign } from "lucide-react";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: rooms } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => { const { data } = await supabase.from("rooms").select("*").order("sort_order"); return data || []; },
  });

  const { data: allBookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-all"],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("*, rooms(name, accent_color)").order("booking_date", { ascending: false });
      return data || [];
    },
  });

  const { data: blockedSlots } = useQuery({
    queryKey: ["admin-blocked-slots"],
    queryFn: async () => { const { data } = await supabase.from("blocked_slots").select("*, rooms(name)").order("blocked_date"); return data || []; },
  });

  const displayedBookings = statusFilter === "all" 
      ? allBookings 
      : allBookings?.filter(b => b.status === statusFilter);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] }); 
      toast.success("Estado actualizado"); 
      setSelectedEvent(null);
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] }); 
      toast.success("Reserva eliminada"); 
      setSelectedEvent(null);
    },
  });

  const addBooking = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("bookings").insert(form);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] }); toast.success("Reserva creada"); setAddOpen(false); },
  });

  const addBlock = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("blocked_slots").insert(form);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Horario bloqueado"); setBlockOpen(false); },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Bloqueo eliminado"); },
  });

  const calendarEvents = [
    ...(allBookings?.map((b: any) => ({
      id: b.id,
      title: `${b.rooms?.name || 'Sala'} - ${b.customer_name} (${b.status})`,
      start: `${b.booking_date}T${b.booking_time}`,
      backgroundColor: b.status === 'cancelled' ? '#ef4444' : (b.rooms?.accent_color || '#3b82f6'),
      borderColor: 'transparent',
      extendedProps: { ...b, isBlock: false },
    })) || []),
    ...(blockedSlots?.map((s: any) => ({
      id: `block-${s.id}`,
      title: `Bloqueado: ${s.rooms?.name || s.reason || 'Mantenimiento'}`,
      start: `${s.blocked_date}T${s.blocked_time}`,
      backgroundColor: '#374151',
      borderColor: '#1f2937',
      extendedProps: { ...s, isBlock: true },
    })) || [])
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground">Reservas</h1>
          <p className="text-muted-foreground mt-2">Gestioná todas las reservas de las salas.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-muted p-1 rounded-md flex mr-4">
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List size={16} className="mr-2" /> Lista
            </Button>
            <Button variant={viewMode === "calendar" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("calendar")}>
              <CalendarIcon size={16} className="mr-2" /> Calendario
            </Button>
          </div>
          <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Ban size={16} className="mr-1" /> Bloquear horario</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Bloquear horario</DialogTitle></DialogHeader>
              <BlockForm rooms={rooms || []} onSubmit={(f: any) => addBlock.mutate(f)} />
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-1" /> Nueva reserva</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Crear reserva manual</DialogTitle></DialogHeader>
              <BookingForm rooms={rooms || []} allBookings={allBookings || []} blockedSlots={blockedSlots || []} onSubmit={(f: any) => addBooking.mutate(f)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm min-h-[600px] text-foreground">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            locale="es"
            events={calendarEvents}
            eventClick={(info) => {
              if (info.event.extendedProps.isBlock) return;
              setSelectedEvent(info.event.extendedProps);
            }}
            height="auto"
            slotMinTime="09:00:00"
            slotMaxTime="23:59:00"
            allDaySlot={false}
          />
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "paid", "completed", "cancelled"].map((s) => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
                {s === "all" ? "Todas" : 
                 s === "pending" ? "Pendientes" : 
                 s === "confirmed" ? "Confirmadas" : 
                 s === "paid" ? "Pagadas" :
                 s === "cancelled" ? "Canceladas" : "Completadas"}
              </Button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Sala</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Hora</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Jugadores</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Acciones</th>
                </tr></thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : !displayedBookings?.length ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay reservas</td></tr>
                  ) : displayedBookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="text-foreground font-medium">{b.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                      </td>
                      <td className="p-4 text-muted-foreground">{b.rooms?.name}</td>
                      <td className="p-4 text-muted-foreground">{b.booking_date}</td>
                      <td className="p-4 text-muted-foreground">{b.booking_time}</td>
                      <td className="p-4 text-muted-foreground">{b.num_players}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          b.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                          b.status === "paid" ? "bg-emerald-500/10 text-emerald-500" :
                          b.status === "confirmed" ? "bg-green-500/10 text-green-500" :
                          b.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        }`}>
                          {b.status === "pending" ? "Pendiente" : 
                           b.status === "confirmed" ? "Confirmada" : 
                           b.status === "paid" ? "Pagada" : 
                           b.status === "cancelled" ? "Cancelada" : "Completada"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {(b.status === "pending" || b.status === "cancelled") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })} title="Confirmar">
                              <Check size={16} />
                            </Button>
                          )}
                          {(b.status === "confirmed") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => updateStatus.mutate({ id: b.id, status: "paid" })} title="Marcar como Pagada">
                              <DollarSign size={16} />
                            </Button>
                          )}
                          {b.status !== "cancelled" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })} title="Cancelar">
                              <X size={16} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if(window.confirm('¿Eliminar reserva?')) deleteBooking.mutate(b.id)}} title="Eliminar">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Horarios bloqueados tabla siempre visible (o solo en lista) */}
      {viewMode === "list" && (
        <div className="mt-8">
          <h2 className="font-display text-2xl text-foreground mb-4">Horarios bloqueados</h2>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Sala</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Hora</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Motivo</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Acción</th>
                </tr></thead>
                <tbody>
                  {!blockedSlots?.length ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin bloqueos</td></tr>
                  ) : blockedSlots.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-muted-foreground">{s.rooms?.name}</td>
                      <td className="p-4 text-muted-foreground">{s.blocked_date}</td>
                      <td className="p-4 text-muted-foreground">{s.blocked_time}</td>
                      <td className="p-4 text-muted-foreground">{s.reason || "-"}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBlock.mutate(s.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Detalles de la Reserva</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 text-sm mt-4">
              <div><strong className="text-muted-foreground block mb-1">Sala:</strong> <span className="text-foreground">{selectedEvent.rooms?.name}</span></div>
              <div><strong className="text-muted-foreground block mb-1">Cliente:</strong> <span className="text-foreground">{selectedEvent.customer_name}</span></div>
              <div><strong className="text-muted-foreground block mb-1">Contacto:</strong> <span className="text-foreground">{selectedEvent.customer_phone} - {selectedEvent.customer_email || 'Sin email'}</span></div>
              <div><strong className="text-muted-foreground block mb-1">Fecha y Hora:</strong> <span className="text-foreground">{selectedEvent.booking_date} a las {selectedEvent.booking_time}</span></div>
              <div><strong className="text-muted-foreground block mb-1">Jugadores:</strong> <span className="text-foreground">{selectedEvent.num_players}</span></div>
              <div>
                <strong className="text-muted-foreground block mb-1">Estado:</strong> 
                <span className="uppercase text-xs font-bold">{selectedEvent.status}</span>
              </div>
              
              <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                {selectedEvent.status !== 'confirmed' && selectedEvent.status !== 'paid' && selectedEvent.status !== 'completed' && (
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: selectedEvent.id, status: "confirmed" })}>Confirmar</Button>
                )}
                {selectedEvent.status === 'confirmed' && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus.mutate({ id: selectedEvent.id, status: "paid" })}>Marcar Pagada</Button>
                )}
                {selectedEvent.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white" onClick={() => updateStatus.mutate({ id: selectedEvent.id, status: "cancelled" })}>Cancelar</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => { if(window.confirm('¿Eliminar?')) deleteBooking.mutate(selectedEvent.id) }}>Eliminar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingForm({ rooms, allBookings, blockedSlots, onSubmit }: { rooms: any[]; allBookings: any[]; blockedSlots: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ room_id: "", customer_name: "", customer_phone: "", customer_email: "", num_players: 2, booking_date: "", booking_time: "", status: "confirmed" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar superposición
    const isOverlapping = allBookings.some(b => 
      b.room_id === form.room_id && 
      b.booking_date === form.booking_date && 
      b.booking_time === form.booking_time && 
      b.status !== 'cancelled'
    );
    
    if (isOverlapping) {
      toast.error("Ya existe una reserva activa para esa sala en la misma fecha y hora.");
      return;
    }

    const isBlocked = blockedSlots.some(s =>
      s.room_id === form.room_id &&
      s.blocked_date === form.booking_date &&
      s.blocked_time === form.booking_time
    );

    if (isBlocked) {
      toast.error("Este horario está bloqueado para esta sala.");
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div><Label>Sala</Label>
        <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })} required>
          <SelectTrigger><SelectValue placeholder="Elegir sala" /></SelectTrigger>
          <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Nombre del cliente</Label><Input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Teléfono</Label><Input required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
        <div><Label>Email (Opcional)</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Jugadores</Label><Input type="number" min={2} max={15} required value={form.num_players} onChange={(e) => setForm({ ...form, num_players: parseInt(e.target.value) })} /></div>
        <div><Label>Estado</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Fecha</Label><Input type="date" required value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} /></div>
        <div><Label>Hora</Label><Input type="time" required value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })} step="1800" /></div>
      </div>
      <Button type="submit" className="w-full mt-4">Crear reserva</Button>
    </form>
  );
}

function BlockForm({ rooms, onSubmit }: { rooms: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ room_id: "", blocked_date: "", blocked_time: "", reason: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 pt-4">
      <div><Label>Sala</Label>
        <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })} required>
          <SelectTrigger><SelectValue placeholder="Elegir sala" /></SelectTrigger>
          <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Fecha</Label><Input type="date" required value={form.blocked_date} onChange={(e) => setForm({ ...form, blocked_date: e.target.value })} /></div>
        <div><Label>Hora (Opcional)</Label><Input type="time" value={form.blocked_time} onChange={(e) => setForm({ ...form, blocked_time: e.target.value })} /></div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground block mb-2">* Si no ingresás hora, aplica solo si bloqueas manual el slot con esa hora vacía (mejor ingresar la hora).</Label>
      </div>
      <div><Label>Motivo (opcional)</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej: Mantenimiento, Feriado" /></div>
      <Button type="submit" className="w-full mt-4" variant="destructive">Bloquear</Button>
    </form>
  );
}
