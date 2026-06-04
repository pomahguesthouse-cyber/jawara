import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Store, Package, LogOut, Sparkles, Shield, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Check if the user is a super_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    return { 
      user: data.user,
      // Mengunci akses admin khusus untuk email Anda saat ini
      isSuperAdmin: !!roleData || data.user.email === 'ical.smg@gmail.com'
    };
  },
  component: DashboardLayout,
});

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/profil", label: "Profil Usaha", icon: Store },
  { to: "/dashboard/produk", label: "Produk", icon: Package },
];

function DashboardLayout() {
  const { user, isSuperAdmin } = Route.useRouteContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user.email ?? "");

  useEffect(() => setEmail(user.email ?? ""), [user.email]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate({ to: "/" });
  }

  // Combined flat list for mobile navigation (max 5 items)
  const mobileItems = [...navItems];
  if (isSuperAdmin) {
    mobileItems.push({ to: "/dashboard/admin/hero", label: "Hero", icon: Layers });
    mobileItems.push({ to: "/dashboard/admin", label: "Admin", icon: Shield });
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border p-5">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src="/logo.png" alt="JAWARA Logo" className="h-9 w-auto object-contain" />
          <span className="font-extrabold text-primary tracking-tight">JAWARA</span>
        </Link>
        
        <nav className="flex-1 space-y-6">
          {/* Main Group */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Dashboard</p>
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/dashboard" }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                activeProps={{ className: "bg-primary-soft text-primary font-semibold" }}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </div>

          {/* Admin: Content Management Group */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Content Management</p>
              <Link
                to="/dashboard/admin/hero"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                activeProps={{ className: "bg-primary-soft text-primary font-semibold" }}
              >
                <Layers className="size-4" />
                Hero Slider
              </Link>
            </div>
          )}

          {/* Admin: Core Administration Group */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Admin Panel</p>
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                activeProps={{ className: "bg-primary-soft text-primary font-semibold" }}
              >
                <Shield className="size-4" />
                Manajemen Data
              </Link>
            </div>
          )}
        </nav>

        <div className="mt-6 p-3 rounded-xl bg-primary-soft text-primary text-xs">
          <p className="flex items-center gap-1.5 font-bold"><Sparkles className="size-3.5" />Segera</p>
          <p className="mt-1 text-primary/80">AI Assistant, Landing Page Builder, dan Chatbot otomatis.</p>
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
            <LogOut className="size-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="JAWARA Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-primary">JAWARA</span>
          </Link>
          <button onClick={signOut} className="text-xs text-muted-foreground"><LogOut className="size-4" /></button>
        </div>
        <nav className="flex border-t border-border">
          {mobileItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/dashboard" }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 pt-28 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
