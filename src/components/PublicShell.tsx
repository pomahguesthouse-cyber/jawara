import type { ReactNode } from "react";
import { PublicNav } from "./layout/PublicNav";
import { PublicFooter } from "./layout/PublicFooter";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1 public-shell-main">{children}</main>
      <PublicFooter />
    </div>
  );
}
