import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

export default function AdminRooms() {
  const queryClient = useQueryClient();
  const [editRoom, setEditRoom] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin-rooms-full"],
    queryFn: async () => { 
      const { data } = await supabase.from("rooms").select("*").order("sort_order"); 
      return data || []; 
    },
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const createRoom = useMutation({
    mutationFn: async (room: any) => {
      const { error } = await supabase.from("rooms").insert({ ...room, slug: generateSlug(room.name) });
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); 
      toast.success("Sala creada con éxito"); 
      setAddOpen(false); 
    },
  });

  const updateRoom = useMutation({
    mutationFn: async (room: any) => {
      const { id, ...rest } = room;
      const { error } = await supabase.from("rooms").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); 
      toast.success("Sala actualizada"); 
      setEditRoom(null); 
    },
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
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-rooms-full"] }); 
      toast.success("Sala eliminada"); 
    },
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
            <Button><Plus size={18} className="mr-2" /> Nueva Sala</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Crear Nueva Sala</DialogTitle></DialogHeader>
            <RoomForm onSubmit={(data) => createRoom.mutate(data)} submitText="Crear Sala" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            Cargando salas...
          </div>
        ) : rooms?.map((room) => (
          <div key={room.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                {room.image_url ? (
                  <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground absolute inset-0 m-auto" />
                )}
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-card" style={{ backgroundColor: room.is_active ? '#10b981' : '#ef4444' }} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-2xl text-foreground">{room.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {room.badge || "Sin categoría"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1 font-medium text-foreground/70">Dificultad: {room.difficulty || '-'}</span>
                  <span className="flex items-center gap-1 font-medium text-foreground/70">Jugadores: {room.min_players}-{room.max_players}</span>
                  <span className="flex items-center gap-1 font-medium text-foreground/70">Duración: {room.time}</span>
                </p>
                  <span className="text-sm font-bold text-primary">Reserva: ${(room as any).price ? (room as any).price.toLocaleString() : "15.000"}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-6 lg:pt-0 border-t lg:border-t-0 border-border">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Activa</span>
                <Switch checked={room.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: room.id, is_active: v })} />
              </div>
              <Dialog open={editRoom?.id === room.id} onOpenChange={(o) => { if (!o) setEditRoom(null); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setEditRoom({ ...room })}>
                    <Pencil size={14} className="mr-2" /> Editar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                  <DialogHeader><DialogTitle>Editar {room.name}</DialogTitle></DialogHeader>
                  <RoomForm initialData={editRoom} onSubmit={(data) => updateRoom.mutate({ ...data, id: room.id })} submitText="Guardar cambios" />
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-10 w-10" onClick={() => { if(window.confirm(`¿Eliminar sala ${room.name}?`)) deleteRoom.mutate(room.id); }}>
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ))}
        {rooms && rooms.length === 0 && (
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-muted/30">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-display text-xl">No hay salas creadas.</p>
            <p className="text-sm mt-1">Hacé clic en "Nueva Sala" para empezar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomForm({ initialData, onSubmit, submitText }: { initialData?: any; onSubmit: (data: any) => void; submitText: string }) {
  const [form, setForm] = useState(initialData || { 
    name: "", description: "", image_url: "", badge: "", tagline: "", difficulty: "Media", difficulty_value: 5, accent_color: "#E67E22",
    players: "2 a 6", time: "60 min", price: 15000, min_players: 2, max_players: 6 
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `rooms/${fileName}`;

      const { data, error } = await supabase.storage
        .from('room_images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('room_images')
        .getPublicUrl(filePath);

      setForm({ ...form, image_url: publicUrl });
      toast.success("Imagen subida correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir la imagen. Asegúrate de que el bucket 'room_images' existe.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 py-4">
      <div className="grid gap-6">
        {/* Sección 1: Básico */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 border-b border-border pb-2">Información Principal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de la Sala</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Las Ruinas de Copán" />
            </div>
            <div className="space-y-2">
              <Label>Categoría / Badge</Label>
              <Input value={form.badge || ""} placeholder="Ej: Aventura · Terror" onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Frase Corta (Tagline)</Label>
            <Input value={form.tagline || ""} placeholder="Ej: Un viaje al corazón de la selva maya" onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descripción Detallada</Label>
            <textarea 
              className="w-full min-h-[120px] bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              value={form.description || ""} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              required 
              placeholder="Describí la atmósfera, la historia y qué esperar de la sala..."
            />
          </div>
        </div>

        {/* Sección 2: Visual & Imagen */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 border-b border-border pb-2">Aspecto Visual</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Imagen de la Sala</Label>
                <div className="flex gap-2">
                  <Input 
                    type="url" 
                    value={form.image_url || ""} 
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })} 
                    placeholder="URL de imagen o subí desde PC →" 
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-shrink-0"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <p className="text-[10px] text-muted-foreground">Podés pegar un enlace directo o subir un archivo (máx 2MB).</p>
              </div>
              <div className="space-y-2">
                <Label>Color de Acento</Label>
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: form.accent_color || "#E67E22" }} />
                  <Input 
                    type="text" 
                    value={form.accent_color || "#E67E22"} 
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })} 
                    className="font-mono text-xs"
                  />
                  <Input 
                    type="color" 
                    value={form.accent_color || "#E67E22"} 
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })} 
                    className="w-10 h-10 p-1 cursor-pointer flex-shrink-0"
                  />
                </div>
              </div>
            </div>
            
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center">
              {form.image_url ? (
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Vista previa de imagen</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Capacidad & Precio */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 border-b border-border pb-2">Capacidad & Precios</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Min. Jugadores</Label>
              <Input type="number" min={1} value={form.min_players || 2} onChange={(e) => setForm({ ...form, min_players: parseInt(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Max. Jugadores</Label>
              <Input type="number" min={1} value={form.max_players || 10} onChange={(e) => setForm({ ...form, max_players: parseInt(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Precio Reserva ($)</Label>
              <Input type="number" min={0} step={500} value={form.price || 15000} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <Input value={form.time || "60 min"} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dificultad (Texto)</Label>
              <Input value={form.difficulty || "Media"} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nivel (1-10)</Label>
              <Input type="number" min={1} max={10} value={form.difficulty_value || 5} onChange={(e) => setForm({ ...form, difficulty_value: parseInt(e.target.value) })} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
            <strong>Nota:</strong> Los precios por jugador (tiers) se gestionan globalmente en Configuraciones. Este valor es el costo base de la reserva.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={uploading}>
        {uploading ? "Subiendo archivos..." : submitText}
      </Button>
    </form>
  );
}
