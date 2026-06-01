// Seed: sobe as imagens do ifood-landing para o bucket `media` (Global) e
// registra em `assets`. Usa service_role (bypassa RLS). Rodar uma vez:
//   node scripts/seed-media.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

// --- carrega .env.local manualmente (sem printar) ---
const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou chave no .env.local');
  process.exit(1);
}

const supabase = createClient(URL_, KEY, { auth: { persistSession: false } });

const SRC = '/Users/daniel.valente/ifood-landing/public/images/ifood';
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

const files = readdirSync(SRC).filter(f => MIME[extname(f).toLowerCase()]);
console.log(`${files.length} imagens encontradas`);

let ok = 0, skip = 0, fail = 0;
for (const f of files) {
  const ext = extname(f).toLowerCase();
  const mime = MIME[ext];
  const storagePath = `global/${f}`;

  // pula se já registrado
  const { data: existing } = await supabase
    .from('assets').select('id').eq('storage_path', storagePath).maybeSingle();
  if (existing) { skip++; continue; }

  const bytes = readFileSync(join(SRC, f));
  const { error: upErr } = await supabase.storage
    .from('media').upload(storagePath, bytes, { contentType: mime, upsert: true });
  if (upErr) { console.error(`upload ${f}:`, upErr.message); fail++; continue; }

  const { data: pub } = supabase.storage.from('media').getPublicUrl(storagePath);
  const { error: dbErr } = await supabase.from('assets').insert({
    vertical_id: null,
    file_url: pub.publicUrl,
    file_name: f,
    file_type: mime,
    file_size: bytes.length,
    storage_path: storagePath,
    alt_text: null,
    uploaded_by: null,
  });
  if (dbErr) { console.error(`db ${f}:`, dbErr.message); fail++; continue; }
  ok++;
}

console.log(`Done. inseridas=${ok} puladas=${skip} falhas=${fail}`);
