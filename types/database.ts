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
  file_url: string;
  file_name: string | null;
  file_type: string;
  file_size: number | null;
  created_at: string;
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
  | VisionBlock
  | GrowthBlock
  | IntegratedBlock
  | ResultsBlock
  | FAQBlock
  | FooterBlock;

export type BlockType =
  | 'navbar'
  | 'hero'
  | 'vision'
  | 'growth'
  | 'integrated'
  | 'results'
  | 'faq'
  | 'footer';

// =============================================
// Block base
// =============================================

interface BaseBlock<T extends BlockType, D> {
  id: string;
  type: T;
  data: D;
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

export interface HeroData {
  title: string[];
  description: string;
  cta_text: string;
  cta_link: string;
  background_image: string;
  logo_decoration: string;
}

export type HeroBlock = BaseBlock<'hero', HeroData>;

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

export interface FAQData {
  badge: string;
  title: string;
  description: string;
  items: FAQItem[];
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export type FAQBlock = BaseBlock<'faq', FAQData>;

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
        Insert: Omit<Page, 'id' | 'created_at' | 'updated_at' | 'vertical_id' | 'ai_adaptation_enabled' | 'ai_adaptation_prompt'> & {
          id?: string;
          vertical_id?: string | null;
          ai_adaptation_enabled?: boolean;
          ai_adaptation_prompt?: string | null;
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
