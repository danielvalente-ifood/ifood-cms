// Normaliza SVGs no bucket media: preserveAspectRatio="none" → "xMidYMid meet"
// (Figma exporta com none, distorcendo ao escalar). Rodar sob policy temporária.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const { data: files, error } = await supabase.storage.from('media').list('global', { limit: 1000 });
if (error) { console.error('list:', error.message); process.exit(1); }

let fixed = 0, skip = 0;
for (const f of files.filter(x => x.name.toLowerCase().endsWith('.svg'))) {
  const path = `global/${f.name}`;
  const { data: blob } = await supabase.storage.from('media').download(path);
  if (!blob) { skip++; continue; }
  const text = await blob.text();
  if (!text.includes('preserveAspectRatio="none"')) { skip++; continue; }
  const out = text.replace(/preserveAspectRatio="none"/g, 'preserveAspectRatio="xMidYMid meet"');
  const { error: upErr } = await supabase.storage.from('media').upload(path, new Blob([out], { type: 'image/svg+xml' }), { upsert: true, contentType: 'image/svg+xml' });
  if (upErr) { console.error(f.name, upErr.message); continue; }
  fixed++;
}
console.log(`SVGs corrigidos=${fixed} ignorados=${skip}`);
