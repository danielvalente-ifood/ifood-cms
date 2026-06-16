/**
 * Seed: cria a página "Conta Digital — iFood Pago" no Supabase CMS.
 * Rodar UMA VEZ:
 *   node scripts/seed-conta-digital.mjs
 *
 * Pré-requisitos:
 *   - Vertical "iFood Pago" já existente no banco
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ou ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// ── env ──────────────────────────────────────────────────────────────────────

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

// ── helpers ───────────────────────────────────────────────────────────────────

const id = () => randomUUID();

// ── blocos ────────────────────────────────────────────────────────────────────

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

  // 2. Hero — split-image
  {
    id: id(), type: 'hero', theme: 0,
    data: {
      variant: 'split-image',
      assetPosition: 'right',
      title: ['Conta Digital', 'A solução financeira para', 'o seu restaurante crescer'],
      description: 'Gerencie crédito, antecipações, Pix e pagamentos em um único lugar. Tudo integrado com a sua operação iFood.',
      image: '',
      ctas: [
        { text: 'Abrir conta grátis', link: '#', style: 'primary' },
        { text: 'Saiba mais', link: '#', style: 'secondary' },
      ],
    },
  },

  // 3. Benefícios — 4 funcionalidades
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'O que você tem na Conta Digital',
      title: ['Tudo que seu restaurante', 'precisa em um só lugar'],
      cards: [
        {
          icon: 'rocket-ship',
          iconColor: '#EB0033',
          iconBgOpacity: 10,
          title: 'Crédito',
          description: 'Acesse capital de giro com condições exclusivas para parceiros iFood. Sem burocracia.',
          ctas: [{ text: 'Conhecer crédito', link: '#', style: 'empty' }],
        },
        {
          icon: 'barchart-default',
          iconColor: '#0070F3',
          iconBgOpacity: 10,
          title: 'Antecipação',
          description: 'Antecipe seus recebíveis e mantenha o fluxo de caixa sempre positivo.',
          ctas: [{ text: 'Antecipar agora', link: '#', style: 'empty' }],
        },
        {
          icon: 'smartphone',
          iconColor: '#00C46A',
          iconBgOpacity: 10,
          title: 'Pix e Pagamentos',
          description: 'Receba e faça transferências via Pix 24h, pague fornecedores e boletos direto pelo app.',
          ctas: [{ text: 'Ver pagamentos', link: '#', style: 'empty' }],
        },
        {
          icon: 'copy-default',
          iconColor: '#F59E0B',
          iconBgOpacity: 10,
          title: 'Cartão empresarial',
          description: 'Cartão de débito para compras e despesas do seu negócio com controle total pelo app.',
          ctas: [{ text: 'Pedir cartão', link: '#', style: 'empty' }],
        },
      ],
    },
  },

  // 4. Content — Meu Caixa (imagem direita)
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Gestão financeira',
      title: ['Meu Caixa', 'Visão completa das suas finanças'],
      description: 'Acompanhe entradas, saídas e saldo em tempo real. Veja o histórico de transações, filtre por período e entenda para onde vai cada centavo do seu negócio.',
      image: '',
      assetPosition: 'right',
      ctas: [{ text: 'Conhecer Meu Caixa', link: '#', style: 'primary' }],
    },
  },

  // 5. Content — Meu Extrato (imagem esquerda)
  {
    id: id(), type: 'content', theme: 0,
    data: {
      badge: 'Transparência total',
      title: ['Meu Extrato', 'Cada movimentação no detalhe'],
      description: 'Visualize todas as transações com data, valor e categoria. Exporte extratos em PDF ou CSV para sua contabilidade. Sem surpresas no fim do mês.',
      image: '',
      assetPosition: 'left',
      ctas: [{ text: 'Ver Meu Extrato', link: '#', style: 'primary' }],
    },
  },

  // 6. Promo — 100% Gratuita (fundo escuro)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Conta 100% Gratuita', 'Sem taxas, sem mensalidades'],
      description: 'Abrir e manter sua Conta Digital iFood Pago não custa nada. Você paga apenas pelas transações que escolher realizar.',
      backgroundType: 'color',
      backgroundColor: '#141414',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Abrir conta grátis', link: '#', style: 'primary' }],
    },
  },

  // 7. Benefícios — Como abrir sua conta (3 passos)
  {
    id: id(), type: 'beneficios', theme: 0,
    data: {
      badge: 'Simples e rápido',
      title: ['Abra sua conta em 3 passos'],
      cards: [
        {
          icon: 'smartphone',
          iconColor: '#EB0033',
          iconBgOpacity: 10,
          title: '1. Baixe o app',
          description: 'Disponível no App Store e Google Play. Gratuito para todos os parceiros iFood.',
        },
        {
          icon: 'file-default',
          iconColor: '#EB0033',
          iconBgOpacity: 10,
          title: '2. Preencha seus dados',
          description: 'CNPJ, CPF e dados básicos do seu restaurante. Leva menos de 5 minutos.',
        },
        {
          icon: 'check',
          iconColor: '#00C46A',
          iconBgOpacity: 10,
          title: '3. Pronto!',
          description: 'Análise em até 24h. Aprovado, sua conta já fica ativa para usar.',
        },
      ],
    },
  },

  // 8. FAQ
  {
    id: id(), type: 'faq', theme: 0,
    data: {
      badge: 'Dúvidas frequentes',
      title: 'Ficou com alguma dúvida?',
      description: 'Respondemos as principais perguntas sobre a Conta Digital iFood Pago.',
      cta: { text: 'Ver todas as dúvidas', link: 'https://www.ifoodpago.com.br/faq' },
      items: [
        { id: 1, question: 'Quem pode abrir uma Conta Digital iFood Pago?', answer: 'Qualquer parceiro iFood com CNPJ ativo pode abrir uma conta. Também aceitamos MEI e profissionais autônomos vinculados à plataforma.' },
        { id: 2, question: 'A conta tem alguma taxa ou mensalidade?', answer: 'Não. A abertura e manutenção da conta são totalmente gratuitas. Alguns serviços específicos como TED podem ter tarifas, mas o Pix é sempre gratuito.' },
        { id: 3, question: 'Em quanto tempo minha conta é aprovada?', answer: 'Analisamos os dados em até 24 horas úteis. Muitos parceiros têm a conta liberada no mesmo dia.' },
        { id: 4, question: 'Posso antecipar meus recebíveis pelo app?', answer: 'Sim. Você escolhe quais valores antecipar e o dinheiro cai na conta em minutos. As taxas são informadas antes da confirmação.' },
        { id: 5, question: 'O que faço se minha solicitação for negada?', answer: 'Em caso de recusa, você recebe um e-mail com orientações. Geralmente está relacionado a pendências cadastrais ou situação do CNPJ. Você pode regularizar e solicitar nova análise.' },
      ],
    },
  },

  // 9. Promo — CTA final (fundo vermelho)
  {
    id: id(), type: 'promo', theme: 0,
    data: {
      layout: 'centered',
      title: ['Receba mais rápido.', 'Cresça com mais controle.'],
      description: 'Junte-se a milhares de restaurantes que já usam a Conta Digital iFood Pago para gerir suas finanças.',
      backgroundType: 'color',
      backgroundColor: '#EB0033',
      contentColor: 'light',
      curtain: false,
      ctas: [{ text: 'Abrir conta grátis', link: '#', style: 'primary' }],
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

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Encontrar vertical iFood Pago
  const { data: verticals, error: vErr } = await supabase
    .from('verticals')
    .select('id, name, slug');

  if (vErr) { console.error('❌  Erro ao buscar verticais:', vErr.message); process.exit(1); }

  console.log('Verticais encontradas:', verticals.map(v => `${v.name} (${v.slug})`).join(', '));

  const vertical = verticals.find(v =>
    v.name.toLowerCase().includes('pago') || v.slug.toLowerCase().includes('pago')
  );

  if (!vertical) {
    console.error('❌  Vertical "iFood Pago" não encontrada. Verifique o nome no banco.');
    console.error('   Verticais disponíveis:', verticals.map(v => v.name).join(', '));
    process.exit(1);
  }

  console.log(`✅  Vertical: ${vertical.name} (id: ${vertical.id})`);

  // 2. Verificar se a página já existe
  const { data: existing } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('slug', 'conta-digital')
    .eq('vertical_id', vertical.id)
    .maybeSingle();

  if (existing) {
    console.log(`ℹ️   Página "conta-digital" já existe (id: ${existing.id}). Pulando criação.`);
    console.log('    Para recriar, delete a página primeiro no CMS.');
    process.exit(0);
  }

  // 3. Verificar se a vertical já tem uma home
  const { data: existingHome } = await supabase
    .from('pages')
    .select('id')
    .eq('vertical_id', vertical.id)
    .eq('is_home', true)
    .maybeSingle();

  const isHome = !existingHome;

  // 4. Criar página
  const { data: page, error: pageErr } = await supabase
    .from('pages')
    .insert({
      name: 'Conta Digital iFood Pago',
      slug: 'conta-digital',
      status: 'published',
      vertical_id: vertical.id,
      is_home: isHome,
      meta_title: 'Conta Digital iFood Pago — A solução financeira para o seu restaurante',
      meta_description: 'Gerencie crédito, antecipações, Pix e pagamentos em um único lugar. Abra sua conta grátis.',
    })
    .select()
    .single();

  if (pageErr) { console.error('❌  Erro ao criar página:', pageErr.message); process.exit(1); }
  console.log(`✅  Página criada: ${page.name} (id: ${page.id}, is_home: ${isHome})`);

  // 5. Criar page_version published
  const content = { blocks };

  const { error: versionErr } = await supabase
    .from('page_versions')
    .insert({
      page_id: page.id,
      content,
      version_type: 'published',
    });

  if (versionErr) { console.error('❌  Erro ao criar versão:', versionErr.message); process.exit(1); }

  // 6. Criar draft idêntico (para o editor abrir direto)
  const { error: draftErr } = await supabase
    .from('page_versions')
    .insert({
      page_id: page.id,
      content,
      version_type: 'draft',
    });

  if (draftErr) { console.error('❌  Erro ao criar draft:', draftErr.message); process.exit(1); }

  console.log(`✅  ${blocks.length} blocos inseridos (draft + published)`);
  console.log('');
  console.log(`🎉  Página disponível em:`);
  console.log(`    CMS:     http://localhost:3000/editor/${page.id}`);
  console.log(`    Landing: /p/conta-digital`);
}

main().catch(e => { console.error(e); process.exit(1); });
