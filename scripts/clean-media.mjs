// Remove do bucket `media` os arquivos global/* que NÃO estão na keep list
// (mídias do ifood-landing não usadas). Rodar uma vez sob policy temporária.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const KEEP = new Set([
  'avatar1.png','avatar2.png','avatar3.png','bg_ifood_ecossistema.png',
  'entregador_bg.png','entregador-icon.png','Gabriel_pizzaprime.png',
  'icon-chevron-right.svg','Logo_decoration.svg','logo_footer.svg',
  'logo-facebook.svg','logo-ifood.svg','logo-instagram.svg','logo-linkedin.svg',
  'loja_bg.png','loja-icon.png','pedido-icon.png','pedidos_bg.png',
  'people_icon.png','star_icon.png','testimoniial_2.png','testimoniial_3.png',
  'testimoniial_4.png','testimoniial_5.png','testimoniial_6.png','visao_integrada.png',
]);

const { data: files, error } = await supabase.storage.from('media').list('global', { limit: 1000 });
if (error) { console.error('list:', error.message); process.exit(1); }

const toRemove = files.filter(f => !KEEP.has(f.name)).map(f => `global/${f.name}`);
console.log(`${files.length} no storage, removendo ${toRemove.length}`);

if (toRemove.length) {
  const { error: delErr } = await supabase.storage.from('media').remove(toRemove);
  if (delErr) { console.error('remove:', delErr.message); process.exit(1); }
}
console.log('Done.');
