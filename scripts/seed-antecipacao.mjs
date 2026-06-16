/**
 * Seed: cria a página "Antecipação — iFood Pago" no Supabase CMS.
 * Rodar UMA VEZ:
 *   node scripts/seed-antecipacao.mjs
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
      title: ['Antecipação', 'Receba mais rápido e impulsione', 'o crescimento do seu restaurante.'],
      description: 'Antecipe o valor das suas vendas no iFood e mantenha o caixa sempre cheio para investir no que importa.',
      image: '',
      ctas: [
        { text: 'Abrir conta grátis', link: '#', style: 'primary' },
        { text: 'Saiba mais', link: '#', style: 'secondary' },
      ],
    },
  },

  // 3. Content — Fluxo de caixa ágil
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'iFood Pago',
      title: ['Seu fluxo de caixa', 'agora mais ágil'],
      description: 'Conheça as soluções do iFood Pago que ajudam você a receber dinheiro mais rápido no seu caixa, oferecendo mais liberdade pra você cuidar do seu negócio.',
      image: '',
      assetPosition: 'right',
      ctas: [{ text: 'Conhecer soluções', link: '#', style: 'primary' }],
    },
  },

  // 4. Content — Antecipação Pontual
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Antecipação Pontual',
      title: ['Surgiu um imprevisto?', 'Antecipe quando precisar'],
      description: 'Antecipe agora o seu valor de vendas acumulado no iFood! Você antecipa apenas o que já vendeu e foi apurado. Por exemplo: se você tem R$ 500 de vendas apuradas, pode antecipar o valor de uma única vez — sem mudar seu plano de recebimento.',
      image: '',
      assetPosition: 'left',
      ctas: [{ text: 'Contrate no iFood Pago', link: '#', style: 'primary' }],
    },
  },

  // 5. Benefícios — 5 vantagens da Antecipação Pontual
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Quais são as vantagens?',
      title: ['Antecipação Pontual', 'feita para o seu ritmo'],
      cards: [
        { icon: 'plugin-addon-puzzle', iconColor: '#EB0033', iconBgOpacity: 10, title: 'Flexibilidade', description: 'Antecipe somente quando necessário, sem compromissos recorrentes.' },
        { icon: 'users-group-default', iconColor: '#0070F3', iconBgOpacity: 10, title: 'Atendimento pontual', description: 'Ideal para necessidades pontuais de fluxo de caixa.' },
        { icon: 'rocket-ship', iconColor: '#00C46A', iconBgOpacity: 10, title: 'Acesso rápido', description: 'Capital de giro disponível em minutos diretamente na conta.' },
        { icon: 'check', iconColor: '#F59E0B', iconBgOpacity: 10, title: 'Sem compromissos', description: 'Sem alterar seu plano de recebimento atual.' },
        { icon: 'barchart-default', iconColor: '#8B5CF6', iconBgOpacity: 10, title: 'Mais autonomia', description: 'Você decide quando e quanto antecipar com total controle.' },
      ],
    },
  },

  // 6. Content — Plano de Repasses
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Plano de Repasses',
      title: ['Receba em até', '7 dias úteis'],
      description: 'Venda hoje e receba em até 7 dias úteis. O plano perfeito para quem quer mais previsibilidade no caixa e menos espera para ver o dinheiro entrar na conta.',
      image: '',
      assetPosition: 'right',
      ctas: [{ text: 'Contrate no app', link: '#', style: 'primary' }],
    },
  },

  // 7. Promo — Dinheiro mais rápido (escuro)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Dinheiro mais rápido', 'na sua conta!'],
      description: 'Gerencie seus repasses e acompanhe seu fluxo de caixa direto pelo iFood Pago.',
      backgroundType: 'color',
      backgroundColor: '#141414',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Baixe o app agora', link: '#', style: 'primary' }],
    },
  },

  // 8. Promo — Tempero do caixa (laranja)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Plano de Repasses do iFood Pago:', 'o tempero que seu caixa precisava!'],
      description: 'Ative o Plano de Repasses e comece a receber em 7 dias úteis a partir de hoje.',
      backgroundType: 'color',
      backgroundColor: '#FF6900',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Quero receber em 7 dias', link: '#', style: 'primary' }],
    },
  },

  // 9. Benefícios — 3 passos para abrir conta
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Comece agora',
      title: ['Abra sua conta em 3 passos'],
      cards: [
        { icon: 'smartphone', iconColor: '#EB0033', iconBgOpacity: 10, title: '1. Baixe o app', description: 'Baixe o app do iFood Pago e toque na opção "Abrir conta digital".' },
        { icon: 'file-default', iconColor: '#EB0033', iconBgOpacity: 10, title: '2. Envie seus dados', description: 'Envie seus dados e sua selfie para identificação. Rápido e seguro.' },
        { icon: 'check', iconColor: '#00C46A', iconBgOpacity: 10, title: '3. Pronto!', description: 'Crie sua senha e comece a usar o banco digital parceiro do seu restaurante.' },
      ],
    },
  },

  // 10. Promo — CTA final (vermelho)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Receba mais rápido', 'com iFood Pago'],
      description: 'Antecipe o dinheiro das suas vendas direto na conta digital.',
      backgroundType: 'color',
      backgroundColor: '#EB0033',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Baixe o app', link: '#', style: 'primary' }],
    },
  },

  // 11. Footer
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
    .from('pages').select('id').eq('slug', 'antecipacao').eq('vertical_id', vertical.id).maybeSingle();

  const force = process.argv.includes('--force');
  if (existing && !force) {
    console.log(`ℹ️   Página "antecipacao" já existe (id: ${existing.id}). Use --force para reinserir blocos.`);
    process.exit(0);
  }

  const pageId = existing?.id ?? null;

  let finalPageId = pageId;

  if (!finalPageId) {
    const { data: page, error: pageErr } = await supabase
      .from('pages')
      .insert({
        name: 'Antecipação iFood Pago',
        slug: 'antecipacao',
        status: 'published',
        vertical_id: vertical.id,
        is_home: false,
        meta_title: 'Antecipação iFood Pago — Receba mais rápido e impulsione seu restaurante',
        meta_description: 'Antecipe o valor das suas vendas no iFood e mantenha o fluxo de caixa sempre positivo. Contrate pelo app iFood Pago.',
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
  console.log(`    Landing: /p/antecipacao`);
}

main().catch(e => { console.error(e); process.exit(1); });
