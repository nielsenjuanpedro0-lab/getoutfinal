import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, History } from "lucide-react";

export default function AdminCustomers() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-all"],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("*, rooms(name)").order("booking_date", { ascending: false });
      return data || [];
    },
  });

  const customers = useMemo(() => {
    if (!bookings) return [];
    const map = new Map<string, any>();
    bookings.forEach((b: any) => {
      // Use email if exists, otherwise phone as unique identifier
      const key = b.customer_email ? b.customer_email.toLowerCase() : b.customer_phone;
      if (!key) return; // Skip if somehow no contact info

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: b.customer_name,
          email: b.customer_email || "-",
          phone: b.customer_phone || "-",
          history: [],
          total_spent: 0
        });
      }
      const customer = map.get(key)!;
      // In case the name improved over time, optionally update name
      if (b.customer_name.length > customer.name.length) customer.name = b.customer_name;
      
      customer.history.push(b);
      // Sum up spending for confirmed/completed/paid bookings if we have room pricing
      if (b.status === "paid" || b.status === "completed" || b.status === "confirmed") {
        customer.total_spent += ((b.rooms as any)?.price || 0);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.history.length - a.history.length);
  }, [bookings]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-4xl text-foreground flex items-center gap-3"><Users size={32} className="text-primary" /> Clientes</h1>
        <p className="text-muted-foreground mt-2">Base de datos de jugadores y su historial de reservas.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Teléfono</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Total Reservas</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Cargando clientes...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay clientes registrados.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-foreground font-medium">{c.name}</td>
                  <td className="p-4 text-muted-foreground">{c.email}</td>
                  <td className="p-4 text-muted-foreground">{c.phone}</td>
                  <td className="p-4 text-muted-foreground">
                    <span className="bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{c.history.length}</span>
                  </td>
                  <td className="p-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(c)}>
                      <History size={16} className="mr-2" /> Ver historial
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Historial de {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                <div><span className="text-muted-foreground">Email:</span> <br/>{selectedCustomer.email}</div>
                <div><span className="text-muted-foreground">Teléfono:</span> <br/>{selectedCustomer.phone}</div>
                <div><span className="text-muted-foreground">Total Reservas:</span> <br/><strong className="text-primary">{selectedCustomer.history.length}</strong></div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Reservas</h3>
                <div className="space-y-3">
                  {selectedCustomer.history.map((b: any, index: number) => (
                    <div key={b.id || index} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 border border-border rounded-lg bg-card">
                      <div>
                        <div className="font-medium text-foreground">{b.rooms?.name || 'Sala Desconocida'}</div>
                        <div className="text-xs text-muted-foreground">{b.booking_date} a las {b.booking_time} · {b.num_players} jugadores</div>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          b.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                          b.status === "paid" ? "bg-emerald-500/10 text-emerald-500" :
                          b.status === "confirmed" ? "bg-green-500/10 text-green-500" :
                          b.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
