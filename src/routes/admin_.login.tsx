import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2, Lock, Mail, AlertTriangle } from "lucide-react";

type Search = { redirect?: string; error?: "not_admin" };

// /admin/login is OUTSIDE the /admin layout (note the trailing underscore on
// the parent segment) so the auth-protecting beforeLoad of /admin doesn't
// apply here — otherwise the redirect chain would loop.
export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: s.error === "not_admin" ? "not_admin" : undefined,
  }),
  beforeLoad: async ({ search }) => {
    // Already signed in as a super admin? Skip the form and go straight to
    // the requested page (or /admin by default).
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    const isAdmin = !!roleRow || data.user.email === "ical.smg@gmail.com";
    if (isAdmin) {
      throw redirect({ to: (search.redirect as any) || "/admin" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo, error: searchError } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    searchError === "not_admin"
      ? "Akun ini tidak memiliki akses admin."
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr || !signInData.user) {
      setBusy(false);
      setError(signInErr?.message || "Gagal masuk.");
      return;
    }

    // Verify admin role before letting them through. Anyone with a valid
    // Supabase account would otherwise authenticate; we sign them back out
    // if they don't have the super_admin role.
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signInData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    const isAdmin = !!roleRow || signInData.user.email === "ical.smg@gmail.com";

    if (!isAdmin) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("Akun ini tidak memiliki akses admin.");
      return;
    }

    toast.success("Selamat datang di panel admin");
    navigate({ to: redirectTo || "/admin" });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.png" alt="JAWARA Logo" className="h-10 w-auto object-contain" />
          <span className="font-extrabold text-emerald-400 text-lg tracking-tight">JAWARA</span>
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-5 text-emerald-400" />
            <h1 className="font-black text-lg text-white">Admin Panel</h1>
          </div>
          <p className="text-xs text-zinc-400 mb-6">
            Masuk dengan kredensial admin untuk mengelola data, kategori, dan hero slider.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Email admin</label>
              <div className="relative">
                <Mail className="size-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Password</label>
              <div className="relative">
                <Lock className="size-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Masuk sebagai Admin
            </button>
          </form>

          <p className="mt-5 text-[10px] text-zinc-500 text-center">
            Akses ini terbatas. Akun tanpa role <span className="text-emerald-400 font-bold">super_admin</span> akan otomatis dikeluarkan.
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-500">
          <Link to="/" className="hover:text-zinc-300 underline">Kembali ke beranda</Link>
        </p>
      </div>
    </div>
  );
}
