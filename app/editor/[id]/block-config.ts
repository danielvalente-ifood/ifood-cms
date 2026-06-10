import type {
  Block,
  BlockType,
  HeroData,
  VisionData,
  GrowthData,
  IntegratedData,
  ResultsData,
  FAQData,
  FooterData,
  PromoData,
  ContentData,
} from '@/types/database';

export type GroupKey = 'hero' | 'content' | 'footer';

export type ContentType = 'vision' | 'growth' | 'integrated' | 'results' | 'faq';

export const HERO_TYPES: BlockType[] = ['hero'];
export const CONTENT_TYPES: ContentType[] = ['vision', 'growth', 'integrated', 'results', 'faq'];
export const FOOTER_TYPES: BlockType[] = ['footer'];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  navbar: 'Navbar',
  hero: 'Hero',
  vision: 'Prova Social',
  growth: 'Growth',
  integrated: 'Features',
  results: 'Depoimentos',
  faq: 'FAQ',
  footer: 'Footer',
  promo: 'Banner Promo',
  content: 'Seção de Conteúdo',
};

export const CONTENT_CATEGORIES: { type: ContentType; label: string }[] = [
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

const HERO_DEFAULTS: HeroData = {
  title: [],
  description: '',
  cta_text: '',
  cta_link: '',
  background_image: '',
  logo_decoration: '',
};

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

export function promoDefaults(layout: 'centered' | 'split' = 'centered'): PromoData {
  return {
    layout,
    assetPosition: 'right',
    backgroundType: 'color',
    backgroundColor: '#272727',
    backgroundImage: '',
    contentColor: 'light',
    curtain: true,
    title: ['Título do banner'],
    description: '',
    image: '',
    ctas: [
      { text: 'Ativar agora', link: '#', style: 'primary' },
      { text: 'Saiba mais', link: '#', style: 'secondary' },
    ],
  };
}

export function contentDefaults(variant: 'image-left' | 'image-right' = 'image-left'): ContentData {
  return {
    assetPosition: variant === 'image-left' ? 'left' : 'right',
    badge: '',
    title: ['Título da seção'],
    description: '',
    image: '',
    ctas: [
      { text: 'Ativar agora', link: '#', style: 'primary' },
    ],
  };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlock(type: BlockType, theme: number): Block {
  const id = generateId();
  switch (type) {
    case 'hero':
      return { id, type: 'hero', data: { ...HERO_DEFAULTS }, theme };
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
    case 'promo':
      return { id, type: 'promo', data: promoDefaults('centered'), theme };
    case 'content':
      return { id, type: 'content', data: contentDefaults('image-left'), theme };
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
