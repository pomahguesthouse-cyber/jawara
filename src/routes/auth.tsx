import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "register"]).optional() }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Masuk / Daftar — JAWARA" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Akun dibuat! Cek email Anda untuk verifikasi.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk dengan Google");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <img src="/logo.png" alt="JAWARA Logo" className="h-10 w-auto object-contain brightness-0 invert" />
          <span className="font-extrabold text-xl">JAWARA</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Bangun masa depan digital UMKM Anda bersama JAWARA.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Kelola produk, profil usaha, dan manfaatkan AI untuk pemasaran — semua dalam satu platform.
          </p>
        </div>
        <div className="absolute -right-32 -bottom-32 size-96 rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center p-8 sm:p-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="JAWARA Logo" className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-primary text-lg">JAWARA</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === "login" ? "Masuk ke akun" : "Daftarkan UMKM"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Selamat datang kembali." : "Gratis dan mudah."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full h-11 rounded-xl bg-card ring-1 ring-border text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted transition disabled:opacity-50"
          >
            <svg className="size-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C33.6 6.2 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.2 8 3l5.7-5.7C33.6 6.2 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5.1l-6-5C29 35.3 26.6 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5h-1.9V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6 5C40.9 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
            Lanjutkan dengan Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" /> atau <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Anda</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar Sekarang"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-bold text-primary hover:underline"
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
