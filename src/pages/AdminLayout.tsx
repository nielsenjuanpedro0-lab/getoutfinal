import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, CalendarDays, DoorOpen, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-getout.jpg";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Reservas", icon: CalendarDays, path: "/admin/bookings" },
  { label: "Salas", icon: DoorOpen, path: "/admin/rooms" },
  { label: "Clientes", icon: Users, path: "/admin/customers" },
  { label: "Configuración", icon: Settings, path: "/admin/settings" },
];

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (!data || data.length === 0) { navigate("/admin/login"); return; }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin/login");
    });

    checkAdmin();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/admin/login");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-8">
          <img src={logo} alt="GetOut!" className="h-8 w-8 rounded-md" />
          <span className="font-display text-xl text-foreground">Admin</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GetOut!" className="h-8 w-8 rounded-md" />
            <span className="font-display text-xl text-foreground">Admin</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        {mobileOpen && (
          <div className="md:hidden border-b border-border bg-card p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
