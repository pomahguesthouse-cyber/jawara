import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, Home, Building2, ShoppingBag, CalendarDays, BookOpen, LayoutDashboard } from "lucide-react";

const navItems = [
  { to: "/direktori",   label: "Direktori",   icon: Building2 },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/event",       label: "Event",        icon: CalendarDays },
  { to: "/artikel",     label: "Edukasi",      icon: BookOpen },
];

export function PublicNav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen]         = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  // Close drawer when route changes
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="JAWARA Logo"
              className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-primary tracking-tight text-base sm:text-lg">JAWARA</span>
              <span className="hidden sm:block text-[9px] uppercase tracking-widest text-muted-foreground">Jaringan Wirausaha</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-primary hover:bg-primary-soft transition-colors"
                activeProps={{ className: "px-3 py-2 text-sm font-medium text-primary bg-primary-soft rounded-lg" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {loggedIn ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="px-3 py-2 text-sm font-semibold text-foreground hover:text-primary">
                  Masuk
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "register" } as never}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                >
                  Daftarkan UMKM
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors active:scale-95"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={`
          fixed top-14 left-0 right-0 z-35 md:hidden
          bg-background border-b border-border shadow-lift
          transition-all duration-300 ease-out overflow-hidden
          ${open ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        `}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
            activeProps={{ className: "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold bg-primary-soft text-primary" }}
          >
            <Home className="size-4 shrink-0" /> Beranda
          </Link>
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
              activeProps={{ className: "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold bg-primary-soft text-primary" }}
            >
              <n.icon className="size-4 shrink-0" /> {n.label}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          {loggedIn ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-primary hover:bg-primary-soft transition-colors"
            >
              <LayoutDashboard className="size-4 shrink-0" /> Dashboard
            </Link>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/auth"
                className="w-full text-center py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/auth"
                search={{ mode: "register" } as never}
                className="w-full text-center py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition"
              >
                Daftarkan UMKM
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            to="/"
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-muted-foreground hover:text-primary transition-colors min-w-0"
            activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-primary min-w-0" }}
          >
            <Home className="size-5" />
            <span className="text-[10px] font-semibold">Beranda</span>
          </Link>
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-muted-foreground hover:text-primary transition-colors min-w-0"
              activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-primary min-w-0" }}
            >
              <n.icon className="size-5" />
              <span className="text-[10px] font-semibold truncate max-w-[3.5rem]">{n.label}</span>
            </Link>
          ))}
          <Link
            to={loggedIn ? "/dashboard" : "/auth"}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-muted-foreground hover:text-primary transition-colors min-w-0"
            activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-primary min-w-0" }}
          >
            <LayoutDashboard className="size-5" />
            <span className="text-[10px] font-semibold">{loggedIn ? "Dashboard" : "Masuk"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
