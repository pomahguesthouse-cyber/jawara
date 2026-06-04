import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Store, Package, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: DashboardLayout,
});

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/profil", label: "Profil Usaha", icon: Store },
  { to: "/dashboard/produk", label: "Produk", icon: Package },
];

function DashboardLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user.email ?? "");

  useEffect(() => setEmail(user.email ?? ""), [user.email]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border p-5">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">J</div>
          <span className="font-extrabold text-primary tracking-tight">Jateng Hub</span>
        </Link>
        <nav className="flex-1 space-y-1">
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
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm">J</div>
            <span className="font-bold text-primary">Jateng Hub</span>
          </Link>
          <button onClick={signOut} className="text-xs text-muted-foreground"><LogOut className="size-4" /></button>
        </div>
        <nav className="flex border-t border-border">
          {navItems.map((n) => (
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
