import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, TrendingUp, DollarSign } from "lucide-react";
import { isThisMonth } from "date-fns";

export default function AdminDashboard() {
  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("*, rooms(name, price)");
      return data || [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["admin-rooms-count"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("id, is_active");
      return data || [];
    },
  });

  const totalBookings = bookings?.length || 0;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookingsArr = bookings?.filter((b) => b.booking_date === todayStr) || [];
  const todayBookings = todayBookingsArr.length;

  // Calculo de ingresos del mes: sumando precio de bookings pagados/confirmados/completados este mes
  const monthlyRevenue = bookings?.reduce((acc, b) => {
    if (b.status === "paid" || b.status === "completed" || b.status === "confirmed") {
      if (b.booking_date && isThisMonth(new Date(b.booking_date))) {
        // En Lovable cloud, si rooms.price existe, lo tomamos. Si no, asumimos 0 por ahora
        const price = (b.rooms as any)?.price || 0;
        return acc + price;
      }
    }
    return acc;
  }, 0) || 0;

  // Tasa de ocupacion simplificada para hoy: (reservas de hoy / (salas activas * supuestos 5 turnos por sala)) * 100
  const activeRoomsCount = rooms?.filter(r => r.is_active)?.length || 1; // evitar division por 0
  const totalSlotsToday = activeRoomsCount * 5; // Asumimos 5 turnos promedio por sala
  const occupancyRate = ((todayBookings / totalSlotsToday) * 100).toFixed(1);

  const stats = [
    { label: "Reservas hoy", value: todayBookings, icon: CalendarDays, color: "text-accent" },
    { label: "Ingresos del mes", value: `$${monthlyRevenue}`, icon: DollarSign, color: "text-green-500" },
    { label: "Ocupación (Hoy)", value: `${occupancyRate}%`, icon: TrendingUp, color: "text-blue-500" },
    { label: "Reservas totales", value: totalBookings, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-4xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Resumen de la actividad de las salas de escape.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-3 transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">{s.label}</span>
              <div className={`p-2 rounded-full bg-muted ${s.color} bg-opacity-10`}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
            <p className="font-display text-3xl text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <h2 className="font-display text-2xl text-foreground mb-4">Próximas reservas del día</h2>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Sala</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Hora</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Estado de pago</th>
                </tr>
              </thead>
              <tbody>
                {(!todayBookingsArr || todayBookingsArr.length === 0) ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay reservas para hoy</td></tr>
                ) : (
                  todayBookingsArr.sort((a,b) => a.booking_time.localeCompare(b.booking_time)).map((b) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground font-medium">{b.customer_name}</td>
                      <td className="p-4 text-muted-foreground">{(b.rooms as any)?.name}</td>
                      <td className="p-4 text-muted-foreground">{b.booking_time}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
