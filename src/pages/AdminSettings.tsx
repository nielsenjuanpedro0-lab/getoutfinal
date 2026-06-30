import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Ban, KeyRound, Trash2, DollarSign, Star, Pencil, Check, X, CalendarDays } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  const { data: rooms } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => { const { data } = await supabase.from("rooms").select("*").order("sort_order"); return data || []; },
  });

  const { data: blockedSlots } = useQuery({
    queryKey: ["admin-blocked-slots"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("blocked_slots").select("*, rooms(name)").order("blocked_date");
      return data || [];
    },
  });

  const { data: businessConfig } = useQuery({
    queryKey: ["admin-business-config"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("business_config").select("key, value");
      const cfg: Record<string, any> = {};
      data?.forEach((row: any) => { cfg[row.key] = row.value; });
      return cfg;
    },
  });

  const saveConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await (supabase as any).from("business_config").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-business-config"] }); toast.success("Configuración guardada"); },
    onError: (err: any) => toast.error(err.message || "Error al guardar"),
  });

  const { data: pricingTiers } = useQuery({
    queryKey: ["admin-pricing-tiers"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("pricing_tiers").select("*").order("sort_order");
      return data || [];
    },
  });

  const addBlock = useMutation({
    mutationFn: async (form: any) => {
      const payload: any = {
        blocked_date: form.blocked_date,
        reason: form.reason,
      };
      if (form.room_id && form.room_id !== "__all__") payload.room_id = form.room_id;
      else payload.room_id = null;
      if (form.blocked_time) payload.blocked_time = form.blocked_time;
      else payload.blocked_time = null;

      const { error } = await (supabase as any).from("blocked_slots").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Horario bloqueado"); },
    onError: (err: any) => toast.error(err.message || "Error al bloquear"),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Bloqueo eliminado"); },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await (supabase as any).from("pricing_tiers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-pricing-tiers"] }); toast.success("Precio actualizado"); },
    onError: (err: any) => toast.error(err.message || "Error al actualizar precio"),
  });

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Las contraseñas no coinciden."); return; }
    if (passwordForm.newPassword.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres."); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success("Contraseña actualizada correctamente.");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar contraseña");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-4xl text-foreground">Configuraciones</h1>
        <p className="text-muted-foreground mt-2">Precios, bloqueos de agenda y perfil.</p>
      </div>

      {/* Open Days Config */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="text-primary" size={24} />
          <h2 className="font-display text-2xl text-foreground">Días Habilitados para Reservas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Activá los días de la semana en que se pueden sacar turnos. Los días desactivados quedan grises en el calendario del cliente.</p>
        <OpenDaysEditor
          openDays={(businessConfig?.open_days as number[]) ?? [0, 6]}
          onSave={(days) => saveConfig.mutate({ key: "open_days", value: days })}
        />
      </div>

      {/* Pricing Tiers */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="text-primary" size={24} />
          <h2 className="font-display text-2xl text-foreground">Precios por Jugadores</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Estos precios se muestran en la web pública. Editá cada rango directamente.</p>
        <PricingTiersEditor tiers={pricingTiers || []} onUpdate={(data) => updateTier.mutate(data)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blocked Slots */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Ban className="text-destructive" size={24} />
            <h2 className="font-display text-2xl text-foreground">Bloqueos de Agenda</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Bloqueá fechas completas o franjas horarias. Usá "Todas las salas" para feriados.</p>

          <BlockForm rooms={rooms || []} onSubmit={(f) => addBlock.mutate(f)} />

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="font-display text-lg mb-4">Bloqueos Activos</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {!blockedSlots?.length ? (
                <p className="text-sm text-muted-foreground">No hay bloqueos activos.</p>
              ) : (
                blockedSlots.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {s.room_id ? s.rooms?.name : <span className="text-destructive font-bold">🔴 Todas las salas</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.blocked_date} {s.blocked_time ? `a las ${s.blocked_time}` : "(Todo el día)"}
                      </div>
                      {s.reason && <div className="text-xs mt-1 text-destructive font-medium">{s.reason}</div>}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => deleteBlock.mutate(s.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="text-primary" size={24} />
            <h2 className="font-display text-2xl text-foreground">Perfil Administrador</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Gestioná tus credenciales de acceso al panel web.</p>

          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Email de administrador</span>
            <span className="text-foreground font-medium">{currentUser?.email || "Cargando..."}</span>
          </div>

          <form onSubmit={updatePassword} className="space-y-4">
            <h3 className="font-display text-lg mb-2">Cambiar Contraseña</h3>
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <div>
              <Label>Confirmar contraseña</Label>
              <Input type="password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            <Button type="submit" className="w-full mt-4">Actualizar Credenciales</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PricingTiersEditor({ tiers, onUpdate }: { tiers: any[]; onUpdate: (data: any) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const startEdit = (tier: any) => {
    setEditId(tier.id);
    setEditForm({ label: tier.label, min_players: tier.min_players, max_players: tier.max_players, price: tier.price, highlight: tier.highlight });
  };

  const save = () => {
    if (!editId) return;
    onUpdate({ id: editId, ...editForm });
    setEditId(null);
  };

  if (!tiers.length) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-dashed border-border text-center">
        No hay tiers cargados. Ejecutá la migración SQL en Supabase primero.
        <br />
        <code className="text-xs bg-muted px-1 rounded mt-1 inline-block">supabase/migrations/20260628000001_pricing_tiers_and_blocked_days.sql</code>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tiers.map((tier: any) => (
        <div key={tier.id} className={`p-4 rounded-xl border transition-all ${tier.highlight ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}>
          {editId === tier.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Etiqueta</Label>
                  <Input value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Precio ($)</Label>
                  <Input type="number" step={500} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Min. Jugadores</Label>
                  <Input type="number" value={editForm.min_players} onChange={(e) => setEditForm({ ...editForm, min_players: parseInt(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Max. Jugadores</Label>
                  <Input type="number" value={editForm.max_players} onChange={(e) => setEditForm({ ...editForm, max_players: parseInt(e.target.value) })} className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editForm.highlight} onCheckedChange={(v) => setEditForm({ ...editForm, highlight: v })} />
                <Label className="text-xs">Destacado (más popular)</Label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} className="flex-1"><Check size={14} className="mr-1" /> Guardar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X size={14} /></Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{tier.label}</span>
                  {tier.highlight && <Star size={12} className="text-primary fill-primary" />}
                </div>
                <span className="font-display text-2xl text-primary">${tier.price.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground ml-1">por persona</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => startEdit(tier)}>
                <Pencil size={12} className="mr-1" /> Editar
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BlockForm({ rooms, onSubmit }: { rooms: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ room_id: "__all__", blocked_date: "", blocked_time: "", reason: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); setForm({ room_id: "__all__", blocked_date: "", blocked_time: "", reason: "" }); }} className="space-y-4">
      <div>
        <Label>Sala</Label>
        <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
          <SelectTrigger><SelectValue placeholder="Elegir sala" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              <span className="flex items-center gap-2 font-bold text-destructive">🔴 Todas las salas (feriado / cierre)</span>
            </SelectItem>
            {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Fecha</Label><Input type="date" required value={form.blocked_date} onChange={(e) => setForm({ ...form, blocked_date: e.target.value })} /></div>
        <div>
          <Label>Hora (dejar vacío = todo el día)</Label>
          <Input type="time" value={form.blocked_time} onChange={(e) => setForm({ ...form, blocked_time: e.target.value })} placeholder="Todo el día" />
        </div>
      </div>
      <div><Label>Motivo</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej: Feriado Nacional, Mantenimiento" required /></div>
      <Button type="submit" className="w-full" variant="destructive">Establecer Bloqueo</Button>
    </form>
  );
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function OpenDaysEditor({ openDays, onSave }: { openDays: number[]; onSave: (days: number[]) => void }) {
  const [days, setDays] = useState<number[]>(openDays);

  useEffect(() => { setDays(openDays); }, [openDays]);

  const toggle = (day: number) => {
    setDays((prev) => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const active = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                active
                  ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "bg-muted/30 border-border text-foreground/40 hover:border-primary/30"
              }`}
            >
              {DAY_NAMES[day].slice(0, 3)}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Días activos: <strong className="text-foreground">{days.map(d => DAY_NAMES[d]).join(", ") || "Ninguno"}</strong>
        </p>
        <Button size="sm" onClick={() => onSave(days)}>
          <Check size={14} className="mr-1" /> Guardar días
        </Button>
      </div>
    </div>
  );
}
