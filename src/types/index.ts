// Unified type definitions for Medisson Lounge website
// Single source of truth for all data structures

// ==================== HERO ====================
export interface HeroContent {
  title: string;
  slogan: string;
  description: string;
  image: string;
}

// ==================== ABOUT ====================
export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface AboutContent {
  title: string;
  description1: string;
  description2: string;
  image: string;
  stats: StatItem[];
}

// ==================== ADVANTAGES ====================
export interface AdvantageItem {
  id: number;
  title: string;
  description: string;
  icon: string; // Lucide icon name as string
}

export interface AdvantagesContent {
  title: string;
  subtitle: string;
  items: AdvantageItem[];
}

// ==================== ATMOSPHERE ====================
export interface AtmosphereItem {
  id: number;
  title: string;
  description: string;
  image: string;
  size: 'small' | 'large';
  className?: string;
}

export interface AtmosphereContent {
  title: string;
  subtitle: string;
  items: AtmosphereItem[];
}

// ==================== MENU CATEGORIES ====================
export interface MenuCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  className?: string;
}

// ==================== CONTACT ====================
export interface SocialLinks {
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ContactInfo {
  phone: string;
  address: string;
  email: string;
  socials: SocialLinks;
}

// ==================== SEO ====================
export interface SEOMeta {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
}

export interface SEOConfig {
  home: SEOMeta;
  news: SEOMeta;
  locations: SEOMeta;
  privacy?: SEOMeta;
  loyalty?: SEOMeta;
  // Dynamic page SEO (keyed by slug: news_slug, location_slug)
  [key: string]: SEOMeta | undefined;
}

// ==================== LOCATIONS ====================
export interface Feature {
  icon: string; // Lucide icon name as string
  title: string;
  desc: string;
}

export interface Location {
  id: number;
  slug: string;
  name: string;
  description: string;
  fullDescription: string;
  image: string;
  gallery: string[];
  address: string;
  phone: string;
  hours: string;
  menuLink: string;
  features: Feature[];
  socialLinks?: SocialLinks;
  coordinates?: string;
  comingSoon?: boolean;
  sortOrder?: number;
}

// ==================== NEWS ====================
export interface NewsItem {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  description: string;
  fullContent: string; // HTML content
  location: string;
}

// ==================== SITE CONTENT (Master) ====================
export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  advantages: AdvantagesContent;
  atmosphere: AtmosphereContent;
  menuCategories: MenuCategory[];
  contact: ContactInfo;
  seo: SEOConfig;
  locations: Location[];
  news: NewsItem[];
}
