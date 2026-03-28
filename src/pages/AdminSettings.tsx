import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, KeyRound, Trash2 } from "lucide-react";

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
    queryFn: async () => { const { data } = await supabase.from("blocked_slots").select("*, rooms(name)").order("blocked_date"); return data || []; },
  });

  const addBlock = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("blocked_slots").insert(form);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Horario bloqueado"); },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] }); toast.success("Bloqueo eliminado"); },
  });

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
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
        <p className="text-muted-foreground mt-2">Ajustes generales, bloqueos de agenda y perfil.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Administrar Bloqueos */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Ban className="text-destructive" size={24} />
            <h2 className="font-display text-2xl text-foreground">Bloqueos de Agenda</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Bloqueá fechas completas o franjas horarias por feriados o mantenimiento de salas.</p>
          
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
                      <div className="font-medium text-sm">{s.rooms?.name}</div>
                      <div className="text-xs text-muted-foreground">{s.blocked_date} {s.blocked_time ? `a las ${s.blocked_time}` : "(Todo el día)"}</div>
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

        {/* Perfil del Administrador */}
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

function BlockForm({ rooms, onSubmit }: { rooms: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ room_id: "", blocked_date: "", blocked_time: "", reason: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); setForm({ room_id: "", blocked_date: "", blocked_time: "", reason: "" }) }} className="space-y-4">
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
      <div><Label>Motivo</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej: Mantenimiento, Feriado" required /></div>
      <Button type="submit" className="w-full" variant="destructive">Establecer Bloqueo</Button>
    </form>
  );
}
