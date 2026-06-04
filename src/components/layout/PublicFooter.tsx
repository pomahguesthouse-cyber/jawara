import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="JAWARA Logo" className="h-8 sm:h-9 w-auto object-contain" />
              <span className="font-extrabold text-primary tracking-tight text-lg">JAWARA</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Memberdayakan ekonomi lokal Jawa Tengah melalui platform digital, AI, dan kolaborasi komunitas UMKM.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3 sm:mb-4">Platform</h5>
            <ul className="space-y-2 sm:space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/direktori" className="hover:text-primary">Direktori UMKM</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary">Marketplace</Link></li>
              <li><Link to="/event" className="hover:text-primary">Event</Link></li>
              <li><Link to="/artikel" className="hover:text-primary">Edukasi</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3 sm:mb-4">UMKM</h5>
            <ul className="space-y-2 sm:space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary">Daftarkan Usaha</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><a href="#" className="hover:text-primary">Panduan</a></li>
              <li><a href="#" className="hover:text-primary">Kontak</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} JAWARA. Semua hak dilindungi.</p>
          <p className="font-medium">Membangun ekonomi lokal Jawa Tengah.</p>
        </div>
      </div>
    </footer>
  );
}
