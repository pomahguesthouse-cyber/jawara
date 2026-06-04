import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">J</div>
              <span className="font-extrabold text-primary tracking-tight text-lg">Jateng Hub</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Memberdayakan ekonomi lokal Jawa Tengah melalui platform digital, AI, dan kolaborasi komunitas UMKM.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Platform</h5>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/direktori" className="hover:text-primary">Direktori UMKM</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary">Marketplace</Link></li>
              <li><Link to="/event" className="hover:text-primary">Event</Link></li>
              <li><Link to="/artikel" className="hover:text-primary">Edukasi</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">UMKM</h5>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary">Daftarkan Usaha</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><a href="#" className="hover:text-primary">Panduan</a></li>
              <li><a href="#" className="hover:text-primary">Kontak</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} UMKM Jateng Hub. Semua hak dilindungi.</p>
          <p className="font-medium">Membangun ekonomi lokal Jawa Tengah.</p>
        </div>
      </div>
    </footer>
  );
}
