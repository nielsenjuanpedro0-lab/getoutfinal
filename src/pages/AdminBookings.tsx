import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Ban, Check, X, Trash2, Calendar as CalendarIcon, List, DollarSign, Pencil, Download } from "lucide-react";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  paid: "Pagada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_CLASSES: Record<string, string> = {
  completed: "bg-blue-500/15 text-blue-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  confirmed: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
  pending: "bg-yellow-500/15 text-yellow-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLASSES[status] || "bg-muted text-foreground"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function exportCSV(bookings: any[]) {
  const headers = ["Nombre", "Teléfono", "Email", "Sala", "Fecha", "Hora", "Hora Fin", "Jugadores", "Estado", "Pago", "Notas"];
  const rows = bookings.map((b) => [
    b.customer_name,
    b.customer_phone,
    b.customer_email || "",
    b.rooms?.name || "",
    b.booking_date,
    b.booking_time,
    b.end_time || "",
    b.num_players,
    STATUS_LABEL[b.status] || b.status,
    b.payment_status || "",
    b.notes || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservas-getout-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    queryFn: async () => { const { data } = await (supabase as any).from("blocked_slots").select("*, rooms(name)").order("blocked_date"); return data || []; },
  });

  const displayedBookings = statusFilter === "all"
    ? allBookings
    : allBookings?.filter(b => b.status === statusFilter);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bookings").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] });
      toast.success("Estado actualizado");
      setSelectedEvent(null);
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("bookings").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] });
      toast.success("Reserva actualizada");
      setEditBooking(null);
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar"),
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
      const { error } = await supabase.from("bookings").insert(form as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings-all"] }); toast.success("Reserva creada"); setAddOpen(false); },
  });

  const addBlock = useMutation({
    mutationFn: async (form: any) => {
      const payload: any = { blocked_date: form.blocked_date, reason: form.reason };
      if (form.room_id && form.room_id !== "__all__") payload.room_id = form.room_id; else payload.room_id = null;
      if (form.blocked_time) payload.blocked_time = form.blocked_time; else payload.blocked_time = null;
      const { error } = await (supabase as any).from("blocked_slots").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Horario bloqueado"); setBlockOpen(false); },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Bloqueo eliminado"); },
  });

  const calendarEvents = [
    ...(allBookings?.map((b: any) => ({
      id: b.id,
      title: `${b.rooms?.name || 'Sala'} - ${b.customer_name}`,
      start: `${b.booking_date}T${b.booking_time}`,
      end: b.end_time ? `${b.booking_date}T${b.end_time}` : undefined,
      backgroundColor: b.status === 'cancelled' ? '#ef4444' : (b.rooms?.accent_color || '#3b82f6'),
      borderColor: 'transparent',
      extendedProps: { ...b, isBlock: false },
    })) || []),
    ...(blockedSlots?.map((s: any) => ({
      id: `block-${s.id}`,
      title: `Bloqueado: ${s.rooms?.name || 'Todas las salas'} - ${s.reason || 'Sin motivo'}`,
      start: s.blocked_time ? `${s.blocked_date}T${s.blocked_time}` : s.blocked_date,
      backgroundColor: '#374151',
      borderColor: '#1f2937',
      extendedProps: { ...s, isBlock: true },
    })) || [])
  ];

  const ActionButtons = useCallback(({ b, size = "icon" }: { b: any; size?: "icon" | "sm" }) => (
    <div className={`flex gap-1 ${size === "sm" ? "flex-wrap" : ""}`}>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setEditBooking({ ...b })} title="Editar">
        <Pencil size={14} />
      </Button>
      {(b.status === "pending" || b.status === "cancelled") && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })} title="Confirmar">
          <Check size={16} />
        </Button>
      )}
      {b.status === "confirmed" && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10" onClick={() => updateStatus.mutate({ id: b.id, status: "paid" })} title="Marcar Pagada">
          <DollarSign size={16} />
        </Button>
      )}
      {b.status !== "cancelled" && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:bg-orange-500/10" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })} title="Cancelar">
          <X size={16} />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm('¿Eliminar reserva?')) deleteBooking.mutate(b.id); }} title="Eliminar">
        <Trash2 size={16} />
      </Button>
    </div>
  ), [updateStatus, deleteBooking]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground">Reservas</h1>
          <p className="text-muted-foreground mt-2">Gestioná todas las reservas de las salas.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="bg-muted p-1 rounded-md flex mr-2">
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List size={16} className="mr-1" /> Lista
            </Button>
            <Button variant={viewMode === "calendar" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("calendar")}>
              <CalendarIcon size={16} className="mr-1" /> Calendario
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCSV(allBookings || [])}>
            <Download size={16} className="mr-1" /> Exportar CSV
          </Button>
          <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Ban size={16} className="mr-1" /> Bloquear</Button>
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
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm min-h-[600px] text-foreground overflow-hidden">
          <FullCalendar
            key={isMobile ? 'mobile' : 'desktop'}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={isMobile ? "listWeek" : "timeGridWeek"}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: isMobile ? 'listWeek,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            locale="es"
            events={calendarEvents}
            eventClick={(info) => { if (info.event.extendedProps.isBlock) return; setSelectedEvent(info.event.extendedProps); }}
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
                {s === "all" ? "Todas" : STATUS_LABEL[s]}
              </Button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-foreground/70 font-semibold">Cliente</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Sala</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Fecha</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Horario</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Jugadores</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Estado</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-foreground/50">Cargando...</td></tr>
                  ) : !displayedBookings?.length ? (
                    <tr><td colSpan={7} className="p-8 text-center text-foreground/50">No hay reservas</td></tr>
                  ) : displayedBookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="text-foreground font-medium">{b.customer_name}</div>
                        <div className="text-xs text-foreground/50">{b.customer_phone}</div>
                      </td>
                      <td className="p-4 text-foreground/80">{b.rooms?.name}</td>
                      <td className="p-4 text-foreground/80">{b.booking_date}</td>
                      <td className="p-4 text-foreground/80">
                        {b.booking_time?.slice(0, 5)}
                        {b.end_time && <span className="text-foreground/40"> → {b.end_time?.slice(0, 5)}</span>}
                      </td>
                      <td className="p-4 text-foreground/80">{b.num_players}</td>
                      <td className="p-4"><StatusBadge status={b.status} /></td>
                      <td className="p-4"><ActionButtons b={b} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              {isLoading ? (
                <div className="text-center p-4 text-foreground/50">Cargando...</div>
              ) : !displayedBookings?.length ? (
                <div className="text-center p-4 text-foreground/50">No hay reservas</div>
              ) : displayedBookings.map((b: any) => (
                <div key={b.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-base text-foreground">{b.customer_name}</div>
                      <div className="text-xs text-foreground/50">{b.customer_phone}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-foreground/50">Sala:</span> <span className="text-foreground font-medium">{b.rooms?.name}</span></div>
                    <div><span className="text-foreground/50">Jugadores:</span> <span className="text-foreground font-medium">{b.num_players}</span></div>
                    <div><span className="text-foreground/50">Fecha:</span> <span className="text-foreground font-medium">{b.booking_date}</span></div>
                    <div>
                      <span className="text-foreground/50">Hora:</span>{" "}
                      <span className="text-foreground font-medium">{b.booking_time?.slice(0, 5)}{b.end_time ? ` → ${b.end_time?.slice(0, 5)}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border/50 justify-end">
                    <ActionButtons b={b} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Blocked slots list */}
      {viewMode === "list" && (
        <div className="mt-8">
          <h2 className="font-display text-2xl text-foreground mb-4">Horarios bloqueados</h2>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-foreground/70 font-semibold">Sala</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Fecha</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Hora</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Motivo</th>
                    <th className="text-left p-4 text-foreground/70 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {!blockedSlots?.length ? (
                    <tr><td colSpan={5} className="p-8 text-center text-foreground/50">Sin bloqueos activos</td></tr>
                  ) : blockedSlots.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground/80">{s.room_id ? s.rooms?.name : <span className="text-destructive font-bold">Todas las salas</span>}</td>
                      <td className="p-4 text-foreground/80">{s.blocked_date}</td>
                      <td className="p-4 text-foreground/80">{s.blocked_time || "Todo el día"}</td>
                      <td className="p-4 text-foreground/80">{s.reason || "-"}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteBlock.mutate(s.id)}>
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

      {/* Edit Booking Dialog */}
      <Dialog open={!!editBooking} onOpenChange={(o) => !o && setEditBooking(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Reserva</DialogTitle></DialogHeader>
          {editBooking && (
            <BookingForm
              rooms={rooms || []}
              allBookings={(allBookings || []).filter((b: any) => b.id !== editBooking.id)}
              blockedSlots={blockedSlots || []}
              initialData={editBooking}
              onSubmit={(data) => updateBooking.mutate({ id: editBooking.id, ...data })}
              submitLabel="Guardar cambios"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Detalles de la Reserva</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 text-sm mt-4">
              <div><span className="text-foreground/60 font-medium">Sala:</span> <span className="text-foreground ml-2">{selectedEvent.rooms?.name}</span></div>
              <div><span className="text-foreground/60 font-medium">Cliente:</span> <span className="text-foreground ml-2">{selectedEvent.customer_name}</span></div>
              <div><span className="text-foreground/60 font-medium">Contacto:</span> <span className="text-foreground ml-2">{selectedEvent.customer_phone} {selectedEvent.customer_email ? `· ${selectedEvent.customer_email}` : ''}</span></div>
              <div><span className="text-foreground/60 font-medium">Fecha y Hora:</span> <span className="text-foreground ml-2">{selectedEvent.booking_date} a las {selectedEvent.booking_time?.slice(0,5)}{selectedEvent.end_time ? ` → ${selectedEvent.end_time?.slice(0,5)}` : ''}</span></div>
              <div><span className="text-foreground/60 font-medium">Jugadores:</span> <span className="text-foreground ml-2">{selectedEvent.num_players}</span></div>
              <div><span className="text-foreground/60 font-medium">Estado:</span> <span className="ml-2"><StatusBadge status={selectedEvent.status} /></span></div>
              <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-primary" onClick={() => { setEditBooking({ ...selectedEvent }); setSelectedEvent(null); }}>
                  <Pencil size={14} className="mr-1" /> Editar
                </Button>
                {selectedEvent.status !== 'confirmed' && selectedEvent.status !== 'paid' && selectedEvent.status !== 'completed' && (
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: selectedEvent.id, status: "confirmed" })}>Confirmar</Button>
                )}
                {selectedEvent.status === 'confirmed' && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus.mutate({ id: selectedEvent.id, status: "paid" })}>Marcar Pagada</Button>
                )}
                {selectedEvent.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" className="text-orange-500" onClick={() => updateStatus.mutate({ id: selectedEvent.id, status: "cancelled" })}>Cancelar</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => { if (window.confirm('¿Eliminar?')) deleteBooking.mutate(selectedEvent.id); }}>Eliminar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingForm({
  rooms, allBookings, blockedSlots, initialData, onSubmit, submitLabel = "Crear reserva"
}: {
  rooms: any[]; allBookings: any[]; blockedSlots: any[];
  initialData?: any; onSubmit: (d: any) => void; submitLabel?: string;
}) {
  const [form, setForm] = useState(initialData || {
    room_id: "", customer_name: "", customer_phone: "", customer_email: "",
    num_players: 2, booking_date: "", booking_time: "", end_time: "",
    status: "confirmed", notes: "", notes_internal: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isOverlapping = allBookings.some(b =>
      b.room_id === form.room_id &&
      b.booking_date === form.booking_date &&
      b.booking_time === form.booking_time &&
      b.status !== 'cancelled'
    );
    if (isOverlapping) { toast.error("Ya existe una reserva activa para esa sala en esa fecha/hora."); return; }

    const payload: any = { ...form };
    if (!payload.end_time) delete payload.end_time;
    if (!payload.notes_internal) delete payload.notes_internal;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <Label>Sala</Label>
        <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })} required>
          <SelectTrigger><SelectValue placeholder="Elegir sala" /></SelectTrigger>
          <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Nombre del cliente</Label><Input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Teléfono</Label><Input required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
        <div><Label>Email (Opcional)</Label><Input type="email" value={form.customer_email || ""} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Jugadores</Label><Input type="number" min={2} max={15} required value={form.num_players} onChange={(e) => setForm({ ...form, num_players: parseInt(e.target.value) })} /></div>
        <div>
          <Label>Estado</Label>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1"><Label>Fecha</Label><Input type="date" required value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} /></div>
        <div><Label>Hora inicio</Label><Input type="time" required value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })} /></div>
        <div>
          <Label>Hora fin <span className="text-foreground/40 font-normal text-xs">(opcional)</span></Label>
          <Input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} placeholder="--:--" />
        </div>
      </div>
      <p className="text-[10px] text-foreground/40 -mt-2">Usá "Hora fin" para cumpleaños o sesiones largas que bloquean la sala varias horas.</p>
      <div><Label>Notas internas <span className="text-foreground/40 font-normal text-xs">(solo visible en admin)</span></Label>
        <Input value={form.notes_internal || ""} onChange={(e) => setForm({ ...form, notes_internal: e.target.value })} placeholder="Ej: 3 salas para cumple, saldo $X" />
      </div>
      <Button type="submit" className="w-full mt-4">{submitLabel}</Button>
    </form>
  );
}

function BlockForm({ rooms, onSubmit }: { rooms: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ room_id: "__all__", blocked_date: "", blocked_time: "", reason: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); setForm({ room_id: "__all__", blocked_date: "", blocked_time: "", reason: "" }); }} className="space-y-4 pt-4">
      <div>
        <Label>Sala</Label>
        <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
          <SelectTrigger><SelectValue placeholder="Elegir sala" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__"><span className="font-bold text-destructive">🔴 Todas las salas (feriado/cierre)</span></SelectItem>
            {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Fecha</Label><Input type="date" required value={form.blocked_date} onChange={(e) => setForm({ ...form, blocked_date: e.target.value })} /></div>
        <div><Label>Hora <span className="text-foreground/40 font-normal text-xs">(vacío = todo el día)</span></Label><Input type="time" value={form.blocked_time} onChange={(e) => setForm({ ...form, blocked_time: e.target.value })} /></div>
      </div>
      <div><Label>Motivo</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej: Feriado Nacional, Mantenimiento" required /></div>
      <Button type="submit" className="w-full mt-4" variant="destructive">Bloquear</Button>
    </form>
  );
}
