import { createFileRoute, Outlet, Link, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { Shield, Layers, ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Admin URL space. Everything under /admin is protected by this route's
// beforeLoad: not signed in -> /admin/login; signed in but not a
// super_admin -> /admin/login with toast.
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.pathname },
      });
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    const isSuperAdmin = !!roleRow || data.user.email === "ical.smg@gmail.com";
    if (!isSuperAdmin) {
      // Sign the non-admin out of the admin context so they're not stuck
      // bouncing off the gate, then send them to the dedicated login page.
      await supabase.auth.signOut();
      throw redirect({
        to: "/admin/login",
        search: { error: "not_admin" },
      });
    }

    return { user: data.user, isSuperAdmin: true as const };
  },
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin", label: "Manajemen Data", icon: Shield, exact: true },
  { to: "/admin/hero", label: "Hero Slider", icon: Layers, exact: false },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar dari panel admin");
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen flex bg-zinc-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-zinc-950 text-zinc-100 border-r border-zinc-900 p-5">
        <Link to="/" className="flex items-center gap-2 mb-2">
          <img src="/logo.png" alt="JAWARA Logo" className="h-9 w-auto object-contain" />
          <span className="font-extrabold text-emerald-400 tracking-tight">JAWARA</span>
        </Link>
        <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-6">
          <Shield className="size-2.5" />
          Admin Panel
        </span>

        <nav className="flex-1 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">Operasional</p>
            {adminNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
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
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </nav>

        <div className="mt-6 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-xs text-zinc-400 hover:text-red-400">
            <LogOut className="size-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-zinc-950 border-b border-zinc-800 text-zinc-100">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="JAWARA Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-emerald-400">
              JAWARA <span className="ml-1 text-[9px] font-black uppercase tracking-wider text-emerald-500/80">Admin</span>
            </span>
          </Link>
          <button onClick={signOut} className="text-xs text-zinc-400">
            <LogOut className="size-4" />
          </button>
        </div>
        <nav className="flex border-t border-zinc-800">
          {adminNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-zinc-400"
              activeProps={{ className: "text-emerald-400" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
          <Link
            to="/"
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-zinc-400"
          >
            <ArrowLeft className="size-4" />
            Beranda
          </Link>
        </nav>
      </div>

      {/* Main area — pathname kept for layout shift tracking only */}
      <main key={pathname} className="flex-1 pt-28 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
