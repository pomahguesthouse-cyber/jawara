import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Store, Package, LogOut, Sparkles, Shield, Layers, ArrowLeft } from "lucide-react";
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

const memberNavItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/profil", label: "Profil Usaha", icon: Store },
  { to: "/dashboard/produk", label: "Produk", icon: Package },
];

const adminNavItems = [
  { to: "/dashboard/admin", label: "Manajemen Data", icon: Shield },
  { to: "/dashboard/admin/hero", label: "Hero Slider", icon: Layers },
];

function DashboardLayout() {
  const { user, isSuperAdmin } = Route.useRouteContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [email, setEmail] = useState(user.email ?? "");

  useEffect(() => setEmail(user.email ?? ""), [user.email]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate({ to: "/" });
  }

  // Admin mode: the URL is inside /dashboard/admin. Hide UMKM-member nav
  // entirely and show only the admin sidebar so admin work is not framed as
  // a member feature.
  const inAdmin = pathname.startsWith("/dashboard/admin");
  const sidebarMode: "admin" | "member" = inAdmin ? "admin" : "member";

  const mobileItems = inAdmin
    ? [...adminNavItems, { to: "/dashboard", label: "Member", icon: ArrowLeft }]
    : isSuperAdmin
    ? [...memberNavItems, { to: "/dashboard/admin", label: "Admin", icon: Shield }]
    : memberNavItems;

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className={`hidden lg:flex w-64 flex-col border-r border-border p-5 ${
        sidebarMode === "admin" ? "bg-zinc-950 text-zinc-100" : "bg-card"
      }`}>
        <Link to="/" className="flex items-center gap-2 mb-2">
          <img src="/logo.png" alt="JAWARA Logo" className="h-9 w-auto object-contain" />
          <span className={`font-extrabold tracking-tight ${
            sidebarMode === "admin" ? "text-emerald-400" : "text-primary"
          }`}>JAWARA</span>
        </Link>
        {sidebarMode === "admin" && (
          <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-6">
            <Shield className="size-2.5" />
            Admin Mode
          </span>
        )}
        {sidebarMode === "member" && <div className="mb-6" />}

        <nav className="flex-1 space-y-6">
          {sidebarMode === "member" ? (
            <>
              {/* Member nav */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Dashboard</p>
                {memberNavItems.map((n) => (
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

              {/* Bridge to admin panel (only super admins) */}
              {isSuperAdmin && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Khusus Admin</p>
                  <Link
                    to="/dashboard/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 text-emerald-400 hover:bg-zinc-800 border border-zinc-800 transition"
                  >
                    <Shield className="size-4" />
                    Masuk Panel Admin
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Admin nav (member items hidden completely) */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">Admin Panel</p>
                {adminNavItems.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    activeOptions={{ exact: n.to === "/dashboard/admin" }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition"
                    activeProps={{ className: "bg-emerald-500/10 text-emerald-300 font-semibold ring-1 ring-emerald-500/30" }}
                  >
                    <n.icon className="size-4" />
                    {n.label}
                  </Link>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">Lainnya</p>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition"
                >
                  <ArrowLeft className="size-4" />
                  Kembali ke Member
                </Link>
              </div>
            </>
          )}
        </nav>

        {sidebarMode === "member" && (
          <div className="mt-6 p-3 rounded-xl bg-primary-soft text-primary text-xs">
            <p className="flex items-center gap-1.5 font-bold"><Sparkles className="size-3.5" />Segera</p>
            <p className="mt-1 text-primary/80">AI Assistant, Landing Page Builder, dan Chatbot otomatis.</p>
          </div>
        )}
        <div className={`mt-6 pt-4 border-t ${sidebarMode === "admin" ? "border-zinc-800" : "border-border"}`}>
          <p className={`text-xs truncate ${sidebarMode === "admin" ? "text-zinc-400" : "text-muted-foreground"}`}>{email}</p>
          <button
            onClick={signOut}
            className={`mt-2 flex items-center gap-2 text-xs ${
              sidebarMode === "admin" ? "text-zinc-400 hover:text-red-400" : "text-muted-foreground hover:text-destructive"
            }`}
          >
            <LogOut className="size-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className={`lg:hidden fixed top-0 inset-x-0 z-30 border-b ${
        sidebarMode === "admin" ? "bg-zinc-950 border-zinc-800" : "bg-card border-border"
      }`}>
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="JAWARA Logo" className="h-7 w-auto object-contain" />
            <span className={`font-bold ${sidebarMode === "admin" ? "text-emerald-400" : "text-primary"}`}>
              JAWARA{sidebarMode === "admin" && <span className="ml-1 text-[9px] font-black uppercase tracking-wider text-emerald-500/80">Admin</span>}
            </span>
          </Link>
          <button
            onClick={signOut}
            className={`text-xs ${sidebarMode === "admin" ? "text-zinc-400" : "text-muted-foreground"}`}
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <nav className={`flex border-t ${sidebarMode === "admin" ? "border-zinc-800" : "border-border"}`}>
          {mobileItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/dashboard" || n.to === "/dashboard/admin" }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                sidebarMode === "admin" ? "text-zinc-400" : "text-muted-foreground"
              }`}
              activeProps={{
                className: sidebarMode === "admin" ? "text-emerald-400" : "text-primary",
              }}
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
