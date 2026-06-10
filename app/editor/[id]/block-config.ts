import type {
  Block,
  BlockType,
  HeroData,
  HeroVariant,
  HeroCTA,
  BeneficiosData,
  BeneficioCard,
  BeneficioCTA,
  ContentData,
  ContentCTA,
  PromoData,
  PromoCTA,
  VisionData,
  GrowthData,
  IntegratedData,
  ResultsData,
  FAQData,
  FooterData,
} from '@/types/database';

export type GroupKey = 'hero' | 'content' | 'footer';

export type ContentType = 'beneficios' | 'content' | 'promo' | 'vision' | 'growth' | 'integrated' | 'results' | 'faq';

export const HERO_TYPES: BlockType[] = ['hero'];
export const CONTENT_TYPES: ContentType[] = ['beneficios', 'content', 'promo', 'vision', 'growth', 'integrated', 'results', 'faq'];
export const FOOTER_TYPES: BlockType[] = ['footer'];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  navbar: 'Navbar',
  hero: 'Hero',
  beneficios: 'Benefícios',
  content: 'Conteúdo',
  promo: 'Banner promocional',
  vision: 'Prova Social',
  growth: 'Growth',
  integrated: 'Features',
  results: 'Depoimentos',
  faq: 'FAQ',
  footer: 'Footer',
};

export const CONTENT_CATEGORIES: { type: ContentType; label: string }[] = [
  { type: 'beneficios', label: 'Benefícios' },
  { type: 'content', label: 'Conteúdo' },
  { type: 'promo', label: 'Banner promocional' },
  { type: 'vision', label: 'Prova Social' },
  { type: 'growth', label: 'Growth' },
  { type: 'integrated', label: 'Features' },
  { type: 'results', label: 'Depoimentos' },
  { type: 'faq', label: 'FAQ' },
];

export function getGroupKey(type: BlockType): GroupKey | null {
  if (type === 'hero') return 'hero';
  if (type === 'footer') return 'footer';
  if ((CONTENT_TYPES as BlockType[]).includes(type)) return 'content';
  return null;
}

export const HERO_VARIANTS: HeroVariant[] = ['full', 'slider', 'centered', 'split-image', 'split-form'];

const HERO_TITLE = ['Atraia mais clientes e venda', 'mais com o Comer Fora'];
const HERO_DESCRIPTION =
  'Delivery, salão, pagamentos e logística em um só lugar. Conecte sua operação, amplifique seu crescimento e ofereça a melhor experiência aos seus clientes.';
const HERO_CTAS: HeroCTA[] = [
  { text: 'Começar agora', link: '#', style: 'primary' },
  { text: 'Saiba mais', link: '#', style: 'secondary' },
];

/** Defaults por variante de Hero — seed ao adicionar o bloco. */
export function heroDefaults(variant: HeroVariant = 'full'): HeroData {
  switch (variant) {
    case 'slider':
      return {
        variant,
        title: HERO_TITLE,
        description: HERO_DESCRIPTION,
        ctas: HERO_CTAS,
        background_image: '',
        slider: true,
        slides: [
          { title: HERO_TITLE, description: HERO_DESCRIPTION, ctas: HERO_CTAS, background_image: '' },
          { title: ['Cresça com inteligência', 'e dados na sua mão'], description: HERO_DESCRIPTION, ctas: HERO_CTAS, background_image: '' },
        ],
      };
    case 'centered':
      return { variant, title: HERO_TITLE, description: HERO_DESCRIPTION, ctas: HERO_CTAS };
    case 'split-image':
      return { variant, title: HERO_TITLE, description: HERO_DESCRIPTION, ctas: HERO_CTAS, assetPosition: 'right', image: '' };
    case 'split-form':
      return {
        variant,
        title: HERO_TITLE,
        description: HERO_DESCRIPTION,
        assetPosition: 'right',
        form: {
          title: 'Fale com a gente',
          subtitle: 'Preencha e retornaremos em breve.',
          label: 'E-mail',
          placeholder: 'seu@email.com',
          button_text: 'Quero saber mais',
          legal: 'Ao continuar, você concorda com nossos termos e política de privacidade.',
          legal_link_text: 'Saiba mais',
          legal_link: '#',
        },
      };
    case 'full':
    default:
      return { variant: 'full', title: HERO_TITLE, description: HERO_DESCRIPTION, ctas: HERO_CTAS, background_image: '' };
  }
}

export type BeneficiosVariant = 'cards' | 'cards-action';

const BENEFICIOS_TITLE = ['A maior base de clientes do Brasil', 'está a um clique do seu salão'];
const BENEFICIOS_CARDS: BeneficioCard[] = [
  {
    icon: 'grid-dashboard-bento',
    title: 'Visão 360 do cliente',
    description:
      'Gerencie pedidos online e experiências presenciais no mesmo lugar. Dados unificados, gestão simplificada, crescimento amplificado.',
  },
  {
    icon: 'barchart-default',
    title: 'Operação unificada',
    description:
      'Conheça o histórico completo: o que pedem online, quando visitam o salão, preferências e ticket médio.',
  },
  {
    icon: 'plugin-addon-puzzle',
    title: 'Crescimento amplificado',
    description:
      'Recebimento automático, entregas eficientes e ferramentas de gestão que conversam entre si. Sem integrações complexas, sem dor de cabeça.',
  },
];
const BENEFICIOS_CTAS: BeneficioCTA[] = [
  { text: 'Saiba mais', link: '#', style: 'primary' },
  { text: 'Ver detalhes', link: '#', style: 'secondary' },
];

/** Defaults por variante de Benefícios — seed ao adicionar o bloco. */
export function beneficiosDefaults(variant: BeneficiosVariant = 'cards'): BeneficiosData {
  const cards = BENEFICIOS_CARDS.map((c) => ({
    ...c,
    ...(variant === 'cards-action' ? { ctas: BENEFICIOS_CTAS.map((x) => ({ ...x })) } : {}),
  }));
  return { badge: 'Visão integrada', title: [...BENEFICIOS_TITLE], cards };
}

export type ContentVariant = 'image-left' | 'image-right';

const CONTENT_TITLE = ['Atraia clientes do delivery', 'para o salão'];
const CONTENT_DESCRIPTION = 'Ative sua base de clientes delivery para visitarem seu restaurante.';
const CONTENT_CTAS: ContentCTA[] = [
  { text: 'Ativar agora', link: '#', style: 'primary' },
  { text: 'Saiba mais', link: '#', style: 'secondary' },
];

/** Defaults por variante de Conteúdo — seed ao adicionar o bloco. */
export function contentDefaults(variant: ContentVariant = 'image-left'): ContentData {
  return {
    badge: 'Comer fora',
    title: [...CONTENT_TITLE],
    description: CONTENT_DESCRIPTION,
    image: '',
    assetPosition: variant === 'image-right' ? 'right' : 'left',
    ctas: CONTENT_CTAS.map((c) => ({ ...c })),
  };
}

export type PromoVariant = 'centered' | 'split';

const PROMO_TITLE = [
  'Seus clientes do delivery agora',
  'podem viver a experiência completa',
  'com você',
];
const PROMO_DESCRIPTION =
  'Uma plataforma que organiza atendimento, pedidos, pagamentos e gestão do salão em um único fluxo, pensado para o ritmo real do restaurante.';
const PROMO_CTAS: PromoCTA[] = [
  { text: 'Ativar agora', link: '#', style: 'primary' },
  { text: 'Saiba mais', link: '#', style: 'secondary' },
];

/** Defaults por variante de Banner promocional — seed ao adicionar o bloco. */
export function promoDefaults(variant: PromoVariant = 'centered'): PromoData {
  return {
    layout: variant,
    title: [...PROMO_TITLE],
    description: PROMO_DESCRIPTION,
    backgroundType: 'color',
    backgroundColor: '#272727',
    backgroundImage: '',
    image: '',
    assetPosition: 'right',
    contentColor: 'light',
    curtain: true,
    ctas: PROMO_CTAS.map((c) => ({ ...c })),
  };
}

const VISION_DEFAULTS: VisionData = {
  badge: '',
  title: [],
  ratings_count: '',
  ratings_text: '',
  avatars: [],
  cards: [],
};

const GROWTH_DEFAULTS: GrowthData = {
  badge: '',
  title: [],
  tabs: [],
};

const INTEGRATED_DEFAULTS: IntegratedData = {
  badge: '',
  title: '',
  image: '',
  features: [],
};

const RESULTS_DEFAULTS: ResultsData = {
  badge: '',
  title: [],
  testimonials: [],
};

const FAQ_DEFAULTS: FAQData = {
  badge: '',
  title: '',
  description: '',
  items: [],
};

const FOOTER_DEFAULTS: FooterData = {
  logo: '',
  copyright: '',
  social_links: [],
  columns: [],
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlock(type: BlockType, theme: number, variant?: string): Block {
  const id = generateId();
  switch (type) {
    case 'hero':
      return { id, type: 'hero', data: heroDefaults((variant as HeroVariant) || 'full'), theme };
    case 'beneficios':
      return { id, type: 'beneficios', data: beneficiosDefaults((variant as BeneficiosVariant) || 'cards'), theme };
    case 'content':
      return { id, type: 'content', data: contentDefaults((variant as ContentVariant) || 'image-left'), theme };
    case 'promo':
      return { id, type: 'promo', data: promoDefaults((variant as PromoVariant) || 'centered'), theme };
    case 'vision':
      return { id, type: 'vision', data: { ...VISION_DEFAULTS }, theme };
    case 'growth':
      return { id, type: 'growth', data: { ...GROWTH_DEFAULTS }, theme };
    case 'integrated':
      return { id, type: 'integrated', data: { ...INTEGRATED_DEFAULTS }, theme };
    case 'results':
      return { id, type: 'results', data: { ...RESULTS_DEFAULTS }, theme };
    case 'faq':
      return { id, type: 'faq', data: { ...FAQ_DEFAULTS }, theme };
    case 'footer':
      return { id, type: 'footer', data: { ...FOOTER_DEFAULTS }, theme };
    default:
      throw new Error(`Block type not supported: ${type}`);
  }
}

export function duplicateBlock(block: Block): Block {
  return {
    ...block,
    id: generateId(),
    data: JSON.parse(JSON.stringify(block.data)),
  };
}
