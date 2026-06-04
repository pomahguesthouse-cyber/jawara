import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";

const navItems = [
  { to: "/direktori", label: "Direktori" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/event", label: "Event" },
  { to: "/artikel", label: "Edukasi" },
];

export function PublicNav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">
            J
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-primary tracking-tight text-lg">Jateng Hub</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">UMKM Platform</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-primary hover:bg-primary-soft transition-colors"
              activeProps={{ className: "text-primary bg-primary-soft" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

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

        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <div className="border-t border-border my-2" />
            {loggedIn ? (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-semibold text-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-semibold">
                  Masuk
                </Link>
                <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-semibold text-primary">
                  Daftarkan UMKM
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
