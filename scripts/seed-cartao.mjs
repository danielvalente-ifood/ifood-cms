/**
 * Seed: cria a página "Cartão de Crédito — iFood Pago" no Supabase CMS.
 * Rodar UMA VEZ:
 *   node scripts/seed-cartao.mjs
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
      title: ['Cartão de Crédito', 'O parceiro que acompanha', 'o dia a dia do seu restaurante.'],
      description: 'Anuidade zero, limite exclusivo para o seu negócio e até 35 dias para pagar. Aceito em todo lugar, físico e online.',
      image: '',
      ctas: [
        { text: 'Quero meu cartão', link: '#', style: 'primary' },
        { text: 'Saiba mais', link: '#', style: 'secondary' },
      ],
    },
  },

  // 3. Benefícios — 4 pilares principais
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Por que escolher o Cartão iFood Pago?',
      title: ['Cartão feito para', 'quem tem restaurante'],
      cards: [
        { icon: 'barchart-default', iconColor: '#EB0033', iconBgOpacity: 10, title: 'Limite exclusivo, todo seu', description: 'Limite de crédito pensado para o crescimento do seu restaurante, sem dividir com despesas pessoais.' },
        { icon: 'check', iconColor: '#00C46A', iconBgOpacity: 10, title: 'Anuidade zero, 100% gratuita', description: 'Sem anuidade, sem tarifas escondidas. Você paga apenas o que gastar.' },
        { icon: 'rocket-ship', iconColor: '#0070F3', iconBgOpacity: 10, title: 'Programa Vai de Visa', description: 'Ofertas exclusivas, cashback e sorteios para quem usa o cartão no dia a dia.' },
        { icon: 'plugin-addon-puzzle', iconColor: '#F59E0B', iconBgOpacity: 10, title: 'Até 35 dias de respiro', description: 'Prazo estendido para pagar sua fatura e manter o fluxo de caixa equilibrado.' },
      ],
    },
  },

  // 4. Benefícios — funcionalidades práticas
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Funcionalidades',
      title: ['Tudo que você precisa', 'em um só cartão'],
      cards: [
        { icon: 'smartphone', iconColor: '#EB0033', iconBgOpacity: 10, title: 'Aceito em todo lugar', description: 'Use em lojas físicas e compras online, em qualquer estabelecimento que aceite Visa.' },
        { icon: 'check', iconColor: '#00C46A', iconBgOpacity: 10, title: 'Encostou, pagou!', description: 'Pagamento por aproximação (NFC) para compras rápidas e sem contato.' },
        { icon: 'copy-default', iconColor: '#0070F3', iconBgOpacity: 10, title: 'Crédito e débito', description: 'Um cartão só com função crédito e débito para todas as suas necessidades.' },
        { icon: 'barchart-default', iconColor: '#8B5CF6', iconBgOpacity: 10, title: 'Parcelamento flexível', description: 'Parcele compras maiores e organize melhor as despesas do seu restaurante.' },
      ],
    },
  },

  // 5. Benefícios — onde usar
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Onde usar',
      title: ['Use onde o seu restaurante', 'mais precisa'],
      cards: [
        { icon: 'users-group-default', iconColor: '#EB0033', iconBgOpacity: 10, title: 'Mercados e atacadistas', description: 'Compre ingredientes e produtos para o seu estoque com limite dedicado.' },
        { icon: 'rocket-ship', iconColor: '#F59E0B', iconBgOpacity: 10, title: 'Postos de combustível', description: 'Abasteça a frota de entrega e reduza as despesas operacionais.' },
        { icon: 'plugin-addon-puzzle', iconColor: '#00C46A', iconBgOpacity: 10, title: 'Equipamentos de cozinha', description: 'Invista em utensílios, equipamentos e melhorias para a sua cozinha.' },
        { icon: 'file-default', iconColor: '#0070F3', iconBgOpacity: 10, title: 'Pagamento de fornecedores', description: 'Pague fornecedores com prazo e mantenha seu capital de giro livre.' },
      ],
    },
  },

  // 6. Promo — solicite pelo app (escuro)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Solicite seu cartão', 'pelo app iFood Pago'],
      description: 'Baixe o app, preencha seus dados e solicite o cartão em minutos. Disponível no App Store e Google Play.',
      backgroundType: 'color',
      backgroundColor: '#141414',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Baixe o app agora', link: '#', style: 'primary' }],
    },
  },

  // 7. Promo — CTA final (vermelho)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Anuidade zero.', 'Limite exclusivo.', 'Quero meu cartão!'],
      description: 'O cartão de crédito feito para o seu restaurante crescer sem pagar nada a mais por isso.',
      backgroundType: 'color',
      backgroundColor: '#EB0033',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Quero meu cartão', link: '#', style: 'primary' }],
    },
  },

  // 8. Footer
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
        { title: 'iFood Pago', badge: null, links: [{ label: 'Conta Digital', url: '#' }, { label: 'Antecipação', url: '#' }, { label: 'Crédito', url: '#' }, { label: 'Cartão', url: '#' }] },
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
    .from('pages').select('id').eq('slug', 'cartao').eq('vertical_id', vertical.id).maybeSingle();

  const force = process.argv.includes('--force');
  if (existing && !force) {
    console.log(`ℹ️   Página "cartao" já existe (id: ${existing.id}). Use --force para reinserir blocos.`);
    process.exit(0);
  }

  let finalPageId = existing?.id ?? null;

  if (!finalPageId) {
    const { data: page, error: pageErr } = await supabase
      .from('pages')
      .insert({
        name: 'Cartão de Crédito iFood Pago',
        slug: 'cartao',
        status: 'published',
        vertical_id: vertical.id,
        is_home: false,
        meta_title: 'Cartão de Crédito iFood Pago — Anuidade zero para o seu restaurante',
        meta_description: 'Cartão de crédito com anuidade zero, limite exclusivo e Programa Vai de Visa. O parceiro financeiro do seu restaurante.',
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
  console.log(`    Landing: /p/cartao`);
}

main().catch(e => { console.error(e); process.exit(1); });
