import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env supaya seed ini bisa jalan.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  const { error } = await supabase.rpc("seed_demo_umkm");
  if (error) {
    console.error("Gagal seed demo UMKM:", error.message);
    process.exit(1);
  }
  console.log("Seed demo UMKM berhasil dijalankan.");
}

run();
