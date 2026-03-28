import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function AdminRooms() {
  const queryClient = useQueryClient();
  const [editRoom, setEditRoom] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin-rooms-full"],
    queryFn: async () => { const { data } = await supabase.from("rooms").select("*").order("sort_order"); return data || []; },
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const createRoom = useMutation({
    mutationFn: async (room: any) => {
      const { error } = await supabase.from("rooms").insert({ ...room, slug: generateSlug(room.name) });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); toast.success("Sala creada con éxito"); setAddOpen(false); },
  });

  const updateRoom = useMutation({
    mutationFn: async (room: any) => {
      const { id, ...rest } = room;
      const { error } = await supabase.from("rooms").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); toast.success("Sala actualizada"); setEditRoom(null); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("rooms").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); },
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); toast.success("Sala eliminada"); },
    onError: (err: any) => {
      if(err?.message?.includes('foreign key')) {
        toast.error("No se puede eliminar la sala porque tiene reservas asociadas.");
      } else {
        toast.error("Error al eliminar la sala.");
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground">Salas de Escape</h1>
          <p className="text-muted-foreground mt-2">Gestioná el catálogo, precios y detalles de tus salas.</p>
        </div>
        
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-2" /> Nueva Sala</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader><DialogTitle>Crear Nueva Sala</DialogTitle></DialogHeader>
            <RoomForm onSubmit={(data) => createRoom.mutate(data)} submitText="Crear Sala" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando salas...</div>
        ) : rooms?.map((room) => (
          <div key={room.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: room.accent_color || "#E67E22" }} />
              <div>
                <h3 className="font-display text-xl text-foreground">{room.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {room.badge && `${room.badge} · `}Dificultad: {room.difficulty || '-'} · 
                  {/* Lovable/Supabase might add standard players string or min/max fallback */}
                  Jugadores: {room.min_players ? `${room.min_players} a ${room.max_players}` : (room.players || '-')} · 
                  Duración: {room.time || '60 min'}
                </p>
                <p className="text-sm font-medium mt-1 text-primary">Precio: ${(room as any).price || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-medium text-muted-foreground">Activa</span>
                <Switch checked={room.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: room.id, is_active: v })} />
              </div>
              <Dialog open={editRoom?.id === room.id} onOpenChange={(o) => { if (!o) setEditRoom(null); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setEditRoom({ ...room })}>
                    <Pencil size={14} className="mr-2" /> Editar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                  <DialogHeader><DialogTitle>Editar {room.name}</DialogTitle></DialogHeader>
                  <RoomForm initialData={editRoom} onSubmit={(data) => updateRoom.mutate({ ...data, id: room.id })} submitText="Guardar cambios" />
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => { if(window.confirm(`¿Eliminar sala ${room.name}?`)) deleteRoom.mutate(room.id); }}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
        {rooms && rooms.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">No hay salas creadas.</div>
        )}
      </div>
    </div>
  );
}

function RoomForm({ initialData, onSubmit, submitText }: { initialData?: any; onSubmit: (data: any) => void; submitText: string }) {
  const [form, setForm] = useState(initialData || { 
    name: "", description: "", image_url: "", badge: "", tagline: "", difficulty: "Media", difficulty_value: 5, accent_color: "#E67E22",
    players: "2 a 6", time: "60 min", price: 0, min_players: 2, max_players: 6 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div><Label>Nombre de la Sala</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Categoría / Etiqueta</Label><Input value={form.badge || ""} placeholder="Ej: Terror" onChange={(e) => setForm({ ...form, badge: e.target.value })} /></div>
        <div><Label>Color de Acento</Label><div className="flex gap-2"><Input type="color" className="w-12 p-1" value={form.accent_color || "#E67E22"} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} /><Input className="flex-1" value={form.accent_color || "#E67E22"} readOnly /></div></div>
      </div>

      <div><Label>Descripción Corta (Tagline)</Label><Input value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
      <div><Label>Descripción Detallada</Label><textarea className="w-full min-h-[100px] bg-background border border-border rounded-md p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
      
      <div><Label>URL de Imagen</Label><Input type="url" value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div><Label>Dificultad Text</Label><Input value={form.difficulty || ""} placeholder="Ej: Media" onChange={(e) => setForm({ ...form, difficulty: e.target.value })} /></div>
        <div><Label>Dificultad (1-10)</Label><Input type="number" min={1} max={10} value={form.difficulty_value || 5} onChange={(e) => setForm({ ...form, difficulty_value: parseInt(e.target.value) })} /></div>
        <div><Label>Costo ($)</Label><Input type="number" min={0} value={form.price || 0} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} required /></div>
        <div><Label>Duración</Label><Input value={form.time || "60 min"} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div><Label>Jugadores (Texto)</Label><Input value={form.players || ""} placeholder="Ej: 2 a 6" onChange={(e) => setForm({ ...form, players: e.target.value })} /></div>
        <div><Label>Min. Jugadores</Label><Input type="number" min={1} value={form.min_players || 2} onChange={(e) => setForm({ ...form, min_players: parseInt(e.target.value) })} required /></div>
        <div><Label>Max. Jugadores</Label><Input type="number" min={1} value={form.max_players || 6} onChange={(e) => setForm({ ...form, max_players: parseInt(e.target.value) })} required /></div>
      </div>

      <Button type="submit" className="w-full mt-6">{submitText}</Button>
    </form>
  );
}
