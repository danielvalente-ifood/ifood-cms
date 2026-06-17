/**
 * Seed: cria a página "Crédito — iFood Pago" no Supabase CMS.
 * Rodar UMA VEZ:
 *   node scripts/seed-credito.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL_ || !KEY) {
  console.error('❌  Faltam NEXT_PUBLIC_SUPABASE_URL ou chave no .env.local');
  process.exit(1);
}

const supabase = createClient(URL_, KEY, { auth: { persistSession: false } });
const id = () => randomUUID();

const blocks = [
  // 1. Navbar
  {
    id: id(), type: 'navbar', theme: 0,
    data: {
      logo: '/images/ifood/ifoodpago-logo.svg',
      cta_text: 'Entrar no portal',
      cta_link: 'https://portal.ifoodpago.com.br',
      items: [],
    },
  },

  // 2. Hero
  {
    id: id(), type: 'hero', theme: 0,
    data: {
      variant: 'split-image',
      assetPosition: 'right',
      title: ['Crédito', 'Seu restaurante merece', 'todo o crédito pra crescer.'],
      description: 'Crédito aprovado com base nas suas vendas no iFood. Condições exclusivas para o seu restaurante, com parcelas debitadas direto dos seus repasses.',
      image: '',
      ctas: [
        { text: 'Entre para a lista de análise', link: '#', style: 'primary' },
        { text: 'Saiba mais', link: '#', style: 'secondary' },
      ],
    },
  },

  // 3. Benefícios — 3 pilares
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Por que escolher o Crédito iFood Pago?',
      title: ['Crédito feito para', 'o seu restaurante'],
      cards: [
        { icon: 'check', iconColor: '#EB0033', iconBgOpacity: 10, title: 'Aprovação facilitada', description: 'Crédito aprovado com base nas suas vendas no iFood. Sem burocracia.' },
        { icon: 'barchart-default', iconColor: '#0070F3', iconBgOpacity: 10, title: 'Condições sob medida', description: 'Limites exclusivos calculados para o seu restaurante.' },
        { icon: 'smartphone', iconColor: '#00C46A', iconBgOpacity: 10, title: 'Parcelas que cabem no bolso', description: 'Com pagamento fácil, debitado direto dos seus repasses.' },
      ],
    },
  },

  // 4. Benefícios — 5 etapas do processo
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Como funciona?',
      title: ['5 etapas simples', 'para ter crédito na conta'],
      cards: [
        { icon: 'plugin-addon-puzzle', iconColor: '#EB0033', iconBgOpacity: 10, title: '1. Simule seu crédito', description: 'Veja as condições disponíveis para o seu restaurante antes de contratar.' },
        { icon: 'file-default', iconColor: '#EB0033', iconBgOpacity: 10, title: '2. Envio de documentos', description: 'Envie seus documentos de forma rápida e segura pelo app.' },
        { icon: 'copy-default', iconColor: '#0070F3', iconBgOpacity: 10, title: '3. Assinatura digital', description: 'Assine o contrato digitalmente, sem sair de casa.' },
        { icon: 'rocket-ship', iconColor: '#00C46A', iconBgOpacity: 10, title: '4. Dinheiro na conta', description: 'O valor cai na sua conta em até 2 dias úteis após a aprovação.' },
        { icon: 'barchart-default', iconColor: '#F59E0B', iconBgOpacity: 10, title: '5. Pagamento das parcelas', description: 'As parcelas são descontadas automaticamente dos seus repasses iFood.' },
      ],
    },
  },

  // 5. Content — Crédito Padrão
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Crédito Padrão',
      title: ['Para restaurantes', 'sem crédito ativo'],
      description: 'Ideal para quem nunca teve crédito no iFood Pago ou já quitou o anterior. Condições personalizadas, 30 dias de carência e primeiro pagamento em até 60 dias.',
      image: '',
      assetPosition: 'right',
      ctas: [{ text: 'Simular crédito', link: '#', style: 'primary' }],
    },
  },

  // 6. Content — Crédito Troca com Troco
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Crédito Troca com Troco',
      title: ['Para restaurantes', 'com crédito ativo'],
      description: 'Já tem crédito ativo? Troque por condições melhores sem perder o histórico. Mantenha o ritmo do seu negócio sem interrupções, com condições exclusivas e carência de 30 dias.',
      image: '',
      assetPosition: 'left',
      ctas: [{ text: 'Trocar meu crédito', link: '#', style: 'primary' }],
    },
  },

  // 7. Content — Mais vendas = mais limite
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Como aumentar meu limite?',
      title: ['Mais vendas no iFood,', 'mais crédito disponível'],
      description: 'Quantidade maior de vendas no iFood resulta em limite de crédito maior. Quanto mais você vende, melhores as condições que você pode acessar.',
      image: '',
      assetPosition: 'right',
      ctas: [{ text: 'Aumentar minhas vendas', link: '#', style: 'primary' }],
    },
  },

  // 8. Promo — Download app (escuro)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Solicite seu crédito', 'pelo app iFood Pago'],
      description: 'Baixe o app, simule as condições e solicite em minutos. Disponível no App Store e Google Play.',
      backgroundType: 'color',
      backgroundColor: '#141414',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Baixe o app agora', link: '#', style: 'primary' }],
    },
  },

  // 9. Promo — CTA final (vermelho)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Crédito certo', 'para o momento certo'],
      description: 'Entre para a lista de análise e descubra o limite disponível para o seu restaurante.',
      backgroundType: 'color',
      backgroundColor: '#EB0033',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Entre para a lista de análise', link: '#', style: 'primary' }],
    },
  },

  // 10. Footer
  {
    id: id(), type: 'footer', theme: 0,
    data: {
      logo: '/images/ifood/logo_footer.svg',
      copyright: '© Copyright 2026 - iFood Pago - Todos os direitos reservados',
      social_links: [
        { platform: 'instagram', url: '#', icon: '/images/ifood/logo-instagram.svg' },
        { platform: 'linkedin',  url: '#', icon: '/images/ifood/logo-linkedin.svg' },
      ],
      columns: [
        { title: 'iFood Pago', badge: null, links: [{ label: 'Conta Digital', url: '#' }, { label: 'Antecipação', url: '#' }, { label: 'Crédito', url: '#' }] },
        { title: 'Ajuda',     badge: null, links: [{ label: 'FAQ', url: 'https://www.ifoodpago.com.br/faq' }, { label: 'Contato', url: '#' }] },
        { title: 'Legal',     badge: null, links: [{ label: 'Privacidade', url: '#' }, { label: 'Termos de uso', url: '#' }] },
      ],
    },
  },
];

async function main() {
  const { data: verticals, error: vErr } = await supabase.from('verticals').select('id, name, slug');
  if (vErr) { console.error('❌  Erro ao buscar verticais:', vErr.message); process.exit(1); }

  const vertical = verticals.find(v =>
    v.name.toLowerCase().includes('pago') || v.slug.toLowerCase().includes('pago')
  );
  if (!vertical) {
    console.error('❌  Vertical "iFood Pago" não encontrada.');
    console.error('   Verticais:', verticals.map(v => v.name).join(', '));
    process.exit(1);
  }
  console.log(`✅  Vertical: ${vertical.name} (id: ${vertical.id})`);

  const { data: existing } = await supabase
    .from('pages').select('id').eq('slug', 'credito').eq('vertical_id', vertical.id).maybeSingle();

  const force = process.argv.includes('--force');
  if (existing && !force) {
    console.log(`ℹ️   Página "credito" já existe (id: ${existing.id}). Use --force para reinserir blocos.`);
    process.exit(0);
  }

  let finalPageId = existing?.id ?? null;

  if (!finalPageId) {
    const { data: page, error: pageErr } = await supabase
      .from('pages')
      .insert({
        name: 'Crédito iFood Pago',
        slug: 'credito',
        status: 'published',
        vertical_id: vertical.id,
        is_home: false,
        meta_title: 'Crédito iFood Pago — Seu restaurante merece todo o crédito pra crescer',
        meta_description: 'Crédito com aprovação facilitada, condições exclusivas e parcelas debitadas direto dos seus repasses. Para parceiros iFood.',
      })
      .select().single();
    if (pageErr) { console.error('❌  Erro ao criar página:', pageErr.message); process.exit(1); }
    finalPageId = page.id;
    console.log(`✅  Página criada: ${page.name} (id: ${page.id})`);
  } else {
    console.log(`✅  Usando página existente (id: ${finalPageId})`);
  }

  const content = { blocks };

  const { error: pubErr } = await supabase.from('page_versions').insert({ page_id: finalPageId, content, version_type: 'published' });
  if (pubErr) { console.error('❌  Erro ao criar versão published:', pubErr.message); process.exit(1); }

  const { error: draftErr } = await supabase.from('page_versions').insert({ page_id: finalPageId, content, version_type: 'draft' });
  if (draftErr) { console.error('❌  Erro ao criar draft:', draftErr.message); process.exit(1); }

  console.log(`✅  ${blocks.length} blocos inseridos (draft + published)`);
  console.log('');
  console.log(`🎉  Página disponível em:`);
  console.log(`    CMS:     http://localhost:3000/editor/${finalPageId}`);
  console.log(`    Landing: /p/credito`);
}

main().catch(e => { console.error(e); process.exit(1); });
