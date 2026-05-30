#!/usr/bin/env node
// Upload seed-asset PNGs into the local Supabase `device-photos` bucket.
// Run after `supabase db reset` to repopulate storage objects (the seed.sql
// inserts photo rows, but objects don't persist across resets).
//
// Usage (from anywhere):
//   node supabase/seed-assets/upload-photos.mjs

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const CLIENT_PKG = path.resolve(HERE, "..", "..", "client", "package.json");
const PHOTOS_DIR = path.join(HERE, "photos");

const require = createRequire(CLIENT_PKG);
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
const BUCKET = "device-photos";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const files = fs.readdirSync(PHOTOS_DIR).filter((f) => f.endsWith(".png"));
let ok = 0;
let fail = 0;
for (const file of files) {
  const buf = fs.readFileSync(path.join(PHOTOS_DIR, file));
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(file, buf, { contentType: "image/png", upsert: true });
  if (error) {
    console.error(`FAIL ${file}: ${error.message}`);
    fail++;
  } else {
    console.log(`OK   ${file}`);
    ok++;
  }
}
console.log(`\nUploaded ${ok}, failed ${fail}`);
process.exit(fail === 0 ? 0 : 1);
