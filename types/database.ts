// =============================================
// Supabase Database Types
// =============================================

export type PageStatus = 'draft' | 'published';
export type VersionType = 'draft' | 'published';
export type UserRole = 'admin' | 'editor' | 'viewer';

// =============================================
// Table row types
// =============================================

export interface Page {
  id: string;
  name: string;
  slug: string;
  status: PageStatus;
  vertical_id: string | null;
  thumbnail_url: string | null;
  ai_adaptation_enabled: boolean;
  ai_adaptation_prompt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  created_by: string | null;
  /** Marca esta página como a "home" da vertical (agrupador). Demais = subpáginas. */
  is_home: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vertical {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string;
}

export interface PageVersion {
  id: string;
  page_id: string;
  content: PageContent;
  version_type: VersionType;
  created_at: string;
}

export interface Asset {
  id: string;
  page_id: string | null;
  vertical_id: string | null;
  file_url: string;
  file_name: string | null;
  file_type: string;
  file_size: number | null;
  storage_path: string | null;
  alt_text: string | null;
  uploaded_by: string | null;
  tags: string[];
  created_at: string;
}

export type AssetMediaType = 'image' | 'video' | 'pdf' | 'other';

export interface AssetWithVertical extends Asset {
  vertical: Vertical | null;
}

// =============================================
// JSON content structure
// =============================================

export interface PageContent {
  blocks: Block[];
}

export type Block =
  | NavbarBlock
  | HeroBlock
  | BeneficiosBlock
  | ContentBlock
  | PromoBlock
  | VisionBlock
  | GrowthBlock
  | IntegratedBlock
  | ResultsBlock
  | FAQBlock
  | FooterBlock
  | StackedBlock
  | BigNumbersBlock
  | LeadFormBlock
  | BigNumbersTestimonialBlock
  | SegmentosBlock
  | SectionTitleBlock
  | ChoiceCardsBlock
  | BrandCarouselBlock;

export type BlockType =
  | 'navbar'
  | 'hero'
  | 'beneficios'
  | 'content'
  | 'promo'
  | 'stacked'
  | 'vision'
  | 'growth'
  | 'integrated'
  | 'results'
  | 'faq'
  | 'footer'
  | 'big-numbers'
  | 'leadform'
  | 'big-numbers-testimonial'
  | 'segmentos'
  | 'section-title'
  | 'choice-cards'
  | 'brand-carousel';

// =============================================
// Block base
// =============================================

/** Configuração estrutural rápida de uma seção (painel estilo Relume). */
export interface SectionConfig {
  name?: string;
  prompt?: string;
  headerType?: string;                 // tipo de layout/header
  style?: 'normal' | 'card';
  assetType?: 'image' | 'video';
  assetPosition?: 'left' | 'right';
  contentType?: 'button' | 'form' | 'none';
}

interface BaseBlock<T extends BlockType, D> {
  id: string;
  type: T;
  data: D;
  theme?: number;
  config?: SectionConfig;
  /** ID de âncora HTML — ex: "lead-form" → href="#lead-form" aponta para esta seção. */
  anchor_id?: string;
}

// =============================================
// Navbar
// =============================================

export interface NavbarData {
  logo: string;
  cta_text: string;
  cta_link: string;
  items: NavbarItem[];
}

export interface NavbarItem {
  label: string;
  href: string | null;
  has_dropdown: boolean;
}

export type NavbarBlock = BaseBlock<'navbar', NavbarData>;

// =============================================
// Hero
// =============================================

export type HeroVariant = 'full' | 'slider' | 'centered' | 'split-image' | 'split-form';

export interface HeroCTA {
  text: string;
  link: string;
  style?: 'primary' | 'secondary' | 'empty' | 'red';
}

export interface HeroSlide {
  title: string[];
  description: string;
  ctas?: HeroCTA[];
  background_image?: string;
}

export interface HeroForm {
  title: string;
  subtitle: string;
  label: string;
  placeholder: string;
  button_text: string;
  legal: string;
  legal_link_text: string;
  legal_link: string;
}

export interface HeroData {
  variant?: HeroVariant;
  title: string[];
  description: string;
  ctas?: HeroCTA[];
  /** cor sólida de fundo (hex) — alternativa à imagem */
  background_color?: string;
  /** full / slider — imagem de fundo (banner único) */
  background_image?: string;
  /** split-image — imagem do card */
  image?: string;
  /** split-image / split-form — posição do card */
  assetPosition?: 'left' | 'right';
  /** full / slider — modo carrossel */
  slider?: boolean;
  /** full / slider — slides (máx. 3) */
  slides?: HeroSlide[];
  /** split-form — campos do formulário */
  form?: HeroForm;
}

export type HeroBlock = BaseBlock<'hero', HeroData>;

// =============================================
// Benefícios (cards)
// =============================================

export interface BeneficioCTA {
  text: string;
  link: string;
  style?: 'primary' | 'secondary' | 'empty';
}

export interface BeneficioCard {
  /** nome do ícone da biblioteca fixa (/public/icons) */
  icon: string;
  title: string;
  description: string;
  /** CTAs opcionais por card (0, 1 ou 2) */
  ctas?: BeneficioCTA[];
  /** Cor do ícone e do fundo do chip (hex) — default '#141414' */
  iconColor?: string;
  /** Opacidade do fundo do chip (0–100) — default 5 */
  iconBgOpacity?: number;
  /** URL de imagem personalizada (50×50) — substitui o chip de ícone */
  image?: string;
}

export interface BeneficiosData {
  badge?: string;
  title: string[];
  description?: string;
  /** mínimo 2, máximo 5 cards */
  cards: BeneficioCard[];
  /** 'default' (com CTAs) | 'compact' (sem CTAs, título 40px) */
  variant?: 'default' | 'compact';
}

export type BeneficiosBlock = BaseBlock<'beneficios', BeneficiosData>;

// =============================================
// Content (seção 2 colunas: imagem + texto)
// =============================================

export interface ContentCTA {
  text: string;
  link: string;
  style?: 'primary' | 'secondary' | 'empty';
  target?: '_blank' | '_self';
}

export interface ContentBullet {
  /** prefixo em negrito (opcional) — ex: "CRM nativo do salão:" */
  label?: string;
  /** texto normal após o label */
  text: string;
}

export interface ContentData {
  badge?: string;
  /** título multi-linha (uma string por linha) */
  title: string[];
  description?: string;
  /** lista de bullets com ícone check vermelho (variante bullets-*) */
  bullets?: ContentBullet[];
  /** imagem do card; vazio = placeholder */
  image?: string;
  /** posição do card de imagem — única variação de layout */
  assetPosition?: 'left' | 'right';
  /** 0, 1 ou 2 CTAs (botões) */
  ctas?: ContentCTA[];
}

export type ContentBlock = BaseBlock<'content', ContentData>;

// =============================================
// Promo Banner (fundo cor/imagem + efeito cortina)
// =============================================

export interface PromoCTA {
  text: string;
  link: string;
  style?: 'primary' | 'secondary' | 'empty' | 'red';
}

export interface PromoData {
  /** centered = texto centralizado · split = texto + card de imagem */
  layout?: 'centered' | 'split';
  title: string[];
  description?: string;
  /** fundo: cor hex única ou imagem */
  backgroundType?: 'color' | 'image';
  backgroundColor?: string;
  backgroundImage?: string;
  /** split — imagem do card e posição */
  image?: string;
  assetPosition?: 'left' | 'right';
  /** esquema do conteúdo: light (fundo escuro) · dark (fundo claro) */
  contentColor?: 'light' | 'dark';
  /** efeito cortina (sticky/parallax estilo nubank) */
  curtain?: boolean;
  /** 0, 1 ou 2 CTAs */
  ctas?: PromoCTA[];
}

export type PromoBlock = BaseBlock<'promo', PromoData>;

// =============================================
// Stacked (cards empilhados scroll-driven, estilo Nubank)
// =============================================

export interface StackedCTA {
  text: string;
  link: string;
}

export interface StackedCard {
  /** rótulo sempre visível (barra do card) */
  label: string;
  /** título grande exibido quando o card está aberto */
  title: string;
  description?: string;
  /** imagem do card aberto */
  image?: string;
  /** botão opcional (outline) */
  cta?: StackedCTA;
}

export interface StackedData {
  badge?: string;
  /** título da seção (uma linha por item) */
  title: string[];
  /** lado da imagem no card aberto */
  assetPosition?: 'left' | 'right';
  /** mínimo 3, máximo 8 cards */
  cards: StackedCard[];
}

export type StackedBlock = BaseBlock<'stacked', StackedData>;

// =============================================
// Vision (Social Proof)
// =============================================

export interface VisionData {
  badge: string;
  title: string[];
  ratings_count: string;
  ratings_text: string;
  avatars: string[];
  cards: VisionCard[];
}

export interface VisionCard {
  id: number;
  title: string;
  bg_image: string;
  icon: string;
  variant: string;
}

export type VisionBlock = BaseBlock<'vision', VisionData>;

// =============================================
// Growth (Tabbed Slider)
// =============================================

export interface GrowthData {
  badge: string;
  title: string[];
  tabs: GrowthTab[];
}

export interface GrowthTab {
  id: string;
  label: string;
  cards: GrowthCard[];
}

export interface GrowthCard {
  id: number;
  title: string;
  description: string;
}

export type GrowthBlock = BaseBlock<'growth', GrowthData>;

// =============================================
// Integrated (Features)
// =============================================

export interface IntegratedData {
  badge: string;
  title: string;
  image: string;
  features: IntegratedFeature[];
}

export interface IntegratedFeature {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export type IntegratedBlock = BaseBlock<'integrated', IntegratedData>;

// =============================================
// Results (Testimonials)
// =============================================

export interface ResultsData {
  badge: string;
  title: string[];
  testimonials: Testimonial[];
  /** 'default' = grid slider com fotos · 'featured' = card único em fundo escuro */
  variant?: 'default' | 'featured';
}

export interface Testimonial {
  id: number;
  name: string;
  company: string;
  image: string;
  main_quote: string;
  full_quote: string;
  rating: number;
}

export type ResultsBlock = BaseBlock<'results', ResultsData>;

// =============================================
// FAQ
// =============================================

export interface FAQCta {
  text: string;
  link: string;
}

export interface FAQData {
  badge: string;
  title: string;
  description: string;
  /** CTA opcional ("Não encontrei minha dúvida"). null/ausente = oculto. */
  cta?: FAQCta | null;
  items: FAQItem[];
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export type FAQBlock = BaseBlock<'faq', FAQData>;

// =============================================
// Big Numbers
// =============================================

export interface BigNumbersStat {
  /** Valor numérico em destaque — ex: "120 milhões", "+450 mil" */
  value: string;
  /** Nome do ícone da biblioteca fixa (/public/icons) */
  icon: string;
  /** Rótulo descritivo — ex: "Pedidos no app" */
  label: string;
  /** Cor pura do ícone (hex, ex: '#141414') */
  iconColor?: string;
  /** Opacidade do fundo do chip de ícone (0–100, default 10) */
  iconBgOpacity?: number;
}

export interface BigNumbersData {
  badge?: string;
  /** Título centralizado (string simples, não array) */
  title: string;
  /** Mínimo 3, máximo 5 stats */
  stats: BigNumbersStat[];
}

export type BigNumbersBlock = BaseBlock<'big-numbers', BigNumbersData>;

// =============================================
// Footer
// =============================================

export interface FooterData {
  logo: string;
  copyright: string;
  social_links: SocialLink[];
  columns: FooterColumn[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface FooterColumn {
  title: string;
  badge: string | null;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  url: string;
}

export type FooterBlock = BaseBlock<'footer', FooterData>;

// =============================================
// LeadForm (formulário de captura de lead)
// =============================================

export interface LeadFormBenefit {
  text: string;
}

export interface LeadFormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select';
  placeholder?: string;
  required?: boolean;
  /** Ocupa as 2 colunas do grid (CNPJ, selects, etc.) */
  fullWidth?: boolean;
  /** Opções disponíveis quando type = 'select' */
  options?: string[];
}

export interface LeadFormData {
  badge?: string;
  title: string;
  subtitle?: string;
  benefits?: LeadFormBenefit[];
  form_title: string;
  fields: LeadFormField[];
  submit_text: string;
  success_message?: string;
}

export type LeadFormBlock = BaseBlock<'leadform', LeadFormData>;

// =============================================
// BigNumbersTestimonial
// =============================================

export interface BigNumbersTestimonialStat {
  value: string;
  description: string;
}

export interface BigNumbersTestimonialCard {
  rating: number;
  quote: string;
  author: string;
  company: string;
}

export interface BigNumbersTestimonialData {
  badge?: string;
  title: string;
  stats: BigNumbersTestimonialStat[];
  testimonials: BigNumbersTestimonialCard[];
  /** 'default' = big numbers + depoimentos · 'triple' = apenas 3 cards lado a lado */
  variant?: 'default' | 'triple';
}

export type BigNumbersTestimonialBlock = BaseBlock<'big-numbers-testimonial', BigNumbersTestimonialData>;

// =============================================
// Segmentos
// =============================================

export interface SegmentosTab {
  label: string;
  icon?: string;
  description: string;
}

export interface SegmentosData {
  badge?: string;
  title: string[];
  tabs: SegmentosTab[];
}

export type SegmentosBlock = BaseBlock<'segmentos', SegmentosData>;

// =============================================
// SectionTitle (título isolado: badge + h2 + descrição)
// =============================================

export interface SectionTitleData {
  badge?: string;
  title: string[];
  description?: string;
  align?: 'center' | 'left';
  theme?: 'light' | 'dark';
}

export type SectionTitleBlock = BaseBlock<'section-title', SectionTitleData>;

// =============================================
// ChoiceCards (cards de perfil — grid vertical)
// =============================================

export interface ChoiceCardChallenge {
  text: string;
}

export interface ChoiceCardNeed {
  text: string;
}

export interface ChoiceCardChoicebox {
  label?: string;
  title: string;
  description: string;
  image?: string;
}

export interface ChoiceCardItem {
  /** nome do ícone da biblioteca fixa (/public/icons) */
  icon: string;
  /** título do card */
  text: string;
  /** cor do ícone e fundo do chip (hex) — default '#EB0033' */
  iconColor?: string;
  /** opacidade do fundo do chip (0–100) — default 10 */
  iconBgOpacity?: number;
  /** subtítulo do card (ex: "Fatura menos de R$40k/mês") */
  subtitle?: string;
  /** lista de desafios */
  challenges?: ChoiceCardChallenge[];
  /** tags de necessidades (pills) */
  needs?: ChoiceCardNeed[];
  /** caixa de produto recomendado */
  choicebox?: ChoiceCardChoicebox;
  /** texto e link do botão CTA */
  ctaText?: string;
  ctaLink?: string;
}

export interface ChoiceCardsData {
  badge?: string;
  title: string[];
  description?: string;
  cards: ChoiceCardItem[];
}

export type ChoiceCardsBlock = BaseBlock<'choice-cards', ChoiceCardsData>;

// =============================================
// BrandCarousel (logos de parceiros)
// =============================================

export interface BrandCarouselLogo {
  src: string;
  alt?: string;
}

export interface BrandCarouselData {
  badge?: string;
  title: string;
  logos: BrandCarouselLogo[];
}

export type BrandCarouselBlock = BaseBlock<'brand-carousel', BrandCarouselData>;

// =============================================
// User Management (RBAC)
// =============================================

export interface CmsUser {
  id: string;
  auth_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserVertical {
  id: string;
  user_id: string;
  vertical_id: string;
  created_at: string;
}

export interface CmsUserWithVerticals extends CmsUser {
  verticals: Vertical[];
}

// =============================================
// A/B Testing
// =============================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';
export type ExperimentType = 'block' | 'page';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  page_id: string;
  status: ExperimentStatus;
  type: ExperimentType;
  traffic_percentage: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  is_control: boolean;
  weight: number;
  target_block_id: string | null;
  block_data: Record<string, any> | null;
  alt_page_id: string | null;
  created_at: string;
}

// =============================================
// Heatmap Tracking
// =============================================

export type EventType = 'click' | 'scroll';

export interface PageEvent {
  id: string;
  page_id: string;
  event_type: EventType;
  x_pct: number | null;
  y_pct: number | null;
  element_tag: string | null;
  element_text: string | null;
  scroll_depth_pct: number | null;
  viewport_width: number | null;
  device_type: string | null;
  session_id: string | null;
  page_slug: string | null;
  experiment_id: string | null;
  variant_id: string | null;
  created_at: string;
}

// =============================================
// Supabase generated types interface
// =============================================

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: Page;
        Insert: Omit<Page, 'id' | 'created_at' | 'updated_at' | 'vertical_id' | 'ai_adaptation_enabled' | 'ai_adaptation_prompt' | 'meta_title' | 'meta_description' | 'og_image' | 'is_home'> & {
          id?: string;
          vertical_id?: string | null;
          ai_adaptation_enabled?: boolean;
          ai_adaptation_prompt?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image?: string | null;
          is_home?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Page, 'id' | 'created_at'>>;
      };
      verticals: {
        Row: Vertical;
        Insert: Omit<Vertical, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Vertical, 'id' | 'created_at'>>;
      };
      page_versions: {
        Row: PageVersion;
        Insert: Omit<PageVersion, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PageVersion, 'id' | 'created_at'>>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>;
      };
      experiments: {
        Row: Experiment;
        Insert: Omit<Experiment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Experiment, 'id' | 'created_at'>>;
      };
      experiment_variants: {
        Row: ExperimentVariant;
        Insert: Omit<ExperimentVariant, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ExperimentVariant, 'id' | 'created_at'>>;
      };
      cms_users: {
        Row: CmsUser;
        Insert: Omit<CmsUser, 'id' | 'role' | 'created_at' | 'updated_at'> & {
          id?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CmsUser, 'id' | 'created_at'>>;
      };
      user_verticals: {
        Row: UserVertical;
        Insert: Omit<UserVertical, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<UserVertical, 'id' | 'created_at'>>;
      };
      page_events: {
        Row: PageEvent;
        Insert: Omit<PageEvent, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PageEvent, 'id' | 'created_at'>>;
      };
    };
  };
}
