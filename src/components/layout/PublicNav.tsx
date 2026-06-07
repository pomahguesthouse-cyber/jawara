import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, Menu, X, Home, Building2, ShoppingBag, CalendarDays, BookOpen, LayoutDashboard, Info } from "lucide-react";

const navItems = [
  { to: "/direktori",   label: "Direktori",    icon: Building2 },
  { to: "/marketplace", label: "Marketplace",  icon: ShoppingBag },
  { to: "/event",       label: "Event",         icon: CalendarDays },
  { to: "/artikel",     label: "Edukasi",       icon: BookOpen },
  { to: "/tentang",     label: "Tentang JAWARA",  icon: Info },
];

export function PublicNav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img src="/logo.png" alt="JAWARA" className="h-9 w-auto object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[#1a6b3c] tracking-tight text-base">JAWARA</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-gray-400 font-semibold">Jaringan Wira Usaha Nusantara</span>
            </div>
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-0">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="relative px-4 py-5 text-sm font-semibold text-gray-600 hover:text-[#1a6b3c] transition-colors"
                activeProps={{ className: "relative px-4 py-5 text-sm font-semibold text-[#1a6b3c]" }}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {n.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1a6b3c] rounded-full" />
                    )}
                  </>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {loggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#155c33] transition"
              >
                <LayoutGrid className="size-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:border-[#1a6b3c] hover:text-[#1a6b3c] transition"
                >
                  Masuk
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "register" } as never}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#155c33] transition"
                >
                  <LayoutGrid className="size-4" /> Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed top-16 left-0 right-0 z-[35] md:hidden bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-out overflow-hidden ${open ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
        <div className="px-4 py-4 flex flex-col gap-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors" activeProps={{ className: "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold bg-green-50 text-[#1a6b3c]" }}>
            <Home className="size-4 shrink-0" /> Beranda
          </Link>
          {navItems.map((n) => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              activeProps={{ className: "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold bg-green-50 text-[#1a6b3c]" }}
            >
              <n.icon className="size-4 shrink-0" /> {n.label}
            </Link>
          ))}
          <div className="h-px bg-gray-100 my-2" />
          {loggedIn ? (
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-[#1a6b3c] hover:bg-green-50 transition-colors">
              <LayoutDashboard className="size-4 shrink-0" /> Dashboard
            </Link>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link to="/auth" className="w-full text-center py-3 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50 transition-colors">Masuk</Link>
              <Link to="/auth" search={{ mode: "register" } as never} className="w-full text-center py-3 rounded-xl bg-[#1a6b3c] text-white text-sm font-bold hover:bg-[#155c33] transition">Daftarkan UMKM</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link to="/" className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-gray-400 hover:text-[#1a6b3c] transition-colors min-w-0" activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-[#1a6b3c] min-w-0" }}>
            <Home className="size-5" /><span className="text-[10px] font-semibold">Beranda</span>
          </Link>
          {navItems.slice(0, 3).map((n) => (
            <Link key={n.to} to={n.to}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-gray-400 hover:text-[#1a6b3c] transition-colors min-w-0"
              activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-[#1a6b3c] min-w-0" }}
            >
              <n.icon className="size-5" /><span className="text-[10px] font-semibold truncate max-w-[3.5rem]">{n.label}</span>
            </Link>
          ))}
          <Link to={loggedIn ? "/dashboard" : "/auth"} className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-gray-400 hover:text-[#1a6b3c] transition-colors min-w-0">
            <LayoutDashboard className="size-5" /><span className="text-[10px] font-semibold">{loggedIn ? "Dashboard" : "Masuk"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
