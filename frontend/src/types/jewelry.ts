// ============================================================
// HEIREST — Core TypeScript Interfaces
// ============================================================

export type MetalPurity = '9K' | '14K' | '18K' | 'PT950';
export type MetalColor = 'YG' | 'WG' | 'RG' | 'PT';
export type StoneType = 'WLD' | 'NTD' | 'SAP' | 'EMR' | 'RBY' | 'AQM' | 'MRG' | 'OPA';
export type StoneCut = 'RND' | 'OV' | 'EMC' | 'PR' | 'HT' | 'MQ' | 'CU' | 'AS';
export type SettingStyle = 'CLW' | 'BEZ' | 'COL' | 'PAV' | 'CHN' | 'BAR';
export type Orientation = 'NS' | 'EW';
export type JewelryCategory = 'RG' | 'PD' | 'ER' | 'BR' | 'NK';
export type JewelryStyle = '5S' | 'SL' | 'ET' | 'SG' | 'LT' | 'MD' | 'ST' | 'DR' | 'HG' | 'TN';
export type ViewMode = 'front' | 'side' | 'body' | 'cad';
export type Currency = 'USD' | 'AUD' | 'GBP' | 'EUR' | 'INR' | 'AED';
export type OrderStage =
  | 'specs_locked'
  | 'cad_approval'
  | 'metal_casting'
  | 'stone_selection'
  | 'master_setting'
  | 'hand_polishing'
  | 'quality_control'
  | 'dispatched';

export type AccountTab = 'designs' | 'vault' | 'orders' | 'profile';

// ---------------------------------------------------------------
// SKU Config — the live state of a jewelry configuration
// ---------------------------------------------------------------
export interface JewelryConfig {
  category: JewelryCategory;
  style: JewelryStyle;
  setting: SettingStyle;
  cut: StoneCut;
  caratWeight: number; // e.g. 1.00
  metalPurity: MetalPurity;
  metalColor: MetalColor;
  stone: StoneType;
  orientation: Orientation;
  ringSize?: string; // e.g. "N", "O", "6.5"
  chainLength?: number; // inches: 16, 18, 20
  engraving?: string;
  stoneCount: number;
  quantity: number;
  authorHandle?: string;
}

// ---------------------------------------------------------------
// Product / Catalog
// ---------------------------------------------------------------
export interface JewelryProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: JewelryCategory;
  style: JewelryStyle;
  defaultConfig: JewelryConfig;
  baseCraftsmanshipFee: number; // USD
  availableMetals: MetalPurity[];
  availableMetalColors: MetalColor[];
  availableStones: StoneType[];
  availableCuts: StoneCut[];
  availableSettings: SettingStyle[];
  availableCaratWeights: number[];
  metalWeightGrams: number;
  tags: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  imagePlaceholderColor: string; // for SVG bg tint
}

// ---------------------------------------------------------------
// Cart
// ---------------------------------------------------------------
export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  config: JewelryConfig;
  sku: string;
  priceUSD: number;
  quantity: number;
  engraving?: string;
  addedAt: string; // ISO
}

// ---------------------------------------------------------------
// Saved Design (My Designs)
// ---------------------------------------------------------------
export interface SavedDesign {
  id: string;
  productId: string;
  productName: string;
  config: JewelryConfig;
  sku: string;
  priceUSD: number;
  savedAt: string;
  authorHandle: string;
  shareUrl: string;
  notes?: string;
}

// ---------------------------------------------------------------
// Vault Item (purchased)
// ---------------------------------------------------------------
export interface VaultItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  config: JewelryConfig;
  purchasedAt: string;
  priceUSD: number;
  certificateNumber: string;
  stoneGradingReport: DiamondGradingReport;
  insuranceValuation: number;
  resizingUsed: boolean;
  inspectionDue: string; // ISO date
}

export interface DiamondGradingReport {
  lab: 'IGI' | 'GIA' | 'GCAL';
  reportNumber: string;
  shape: StoneCut;
  caratWeight: number;
  color: string; // D, E, F, G etc
  clarity: string; // VVS1, VS2 etc
  cut: string; // Excellent, Very Good
  polish: string;
  symmetry: string;
  fluorescence: string;
  measurements: string; // "6.50 x 6.48 x 4.05 mm"
}

// ---------------------------------------------------------------
// Order
// ---------------------------------------------------------------
export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  totalUSD: number;
  placedAt: string;
  estimatedCompletionDate: string;
  currentStage: OrderStage;
  stages: OrderStageRecord[];
  shippingAddress: Address;
  trackingNumber?: string;
  cadRenderApproved?: boolean;
  cadRenderUrl?: string;
}

export interface OrderStageRecord {
  stage: OrderStage;
  label: string;
  description: string;
  completedAt?: string;
  isPending: boolean;
  isActive: boolean;
  requiresApproval?: boolean;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

// ---------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------
export interface FingerSizeEntry {
  hand: 'left' | 'right';
  finger: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  size: string; // e.g. "N", "L½", "6.5"
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  authorHandle: string;
  avatarInitials: string;
  fingerSizes: FingerSizeEntry[];
  preferredChainLengths: number[];
  sizingKitVoucherCode?: string;
  sizingKitRedeemed: boolean;
  memberSince: string;
}

// ---------------------------------------------------------------
// Community Design (Authored By You carousel)
// ---------------------------------------------------------------
export interface CommunityDesign {
  id: string;
  authorHandle: string;
  timestamp: string;
  sku: string;
  config: JewelryConfig;
  description: string;
  likes: number;
  productId: string;
  accentColor: string;
}

// ---------------------------------------------------------------
// Press / Editorial
// ---------------------------------------------------------------
export interface PressQuote {
  publication: string;
  quote: string;
  year: number;
}

// ---------------------------------------------------------------
// Pricing rates
// ---------------------------------------------------------------
export interface PricingRates {
  metalPurityRate: Record<MetalPurity, number>; // USD per gram
  metalColorPremium: Record<MetalColor, number>; // multiplier
  stoneTypeRate: Record<StoneType, number>; // USD per carat
  cutPremiumMultiplier: Record<StoneCut, number>; // multiplier
}

export interface CurrencyRate {
  code: Currency;
  symbol: string;
  name: string;
  rateFromUSD: number;
}

// ---------------------------------------------------------------
// Authentication Types
// ---------------------------------------------------------------
export type MembershipTier = 'Private Client' | 'Collector' | 'Founding Author';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  authorHandle: string;       // e.g. "@indiemoxley"
  avatarUrl?: string;
  membershipTier: MembershipTier;
  role: 'customer' | 'admin'; // RBAC role
  sizingKitVoucherCode?: string; // e.g. "HEIREST-KIT-19"
  savedSizes?: FingerSizeEntry[];
  createdAt: string; // ISO
}

// ---------------------------------------------------------------
// Admin — CMS Settings
// ---------------------------------------------------------------
export interface CmsSettings {
  announcementBarVisible: boolean;
  announcementBarText: string;
  sizingKitPrice: number;
  heroHeadline: string;
  heroSubheadline: string;
  heroMediaUrl: string;
}

// ---------------------------------------------------------------
// Admin — Product Input (for create / edit in CatalogManager)
// ---------------------------------------------------------------
export interface AdminProductInput {
  name: string;
  slug: string;
  category: JewelryCategory;
  style: JewelryStyle;
  shortDescription: string;
  baseCraftsmanshipFee: number;
  metalWeightGrams: number;
  availableMetals: MetalPurity[];
  availableMetalColors: MetalColor[];
  availableStones: StoneType[];
  availableCuts: StoneCut[];
  availableSettings: SettingStyle[];
  availableCaratWeights: number[];
  imagePlaceholderColor: string;
  studioImageUrl?: string;
  lifestyleImageUrl?: string;
  isActive: boolean;
  tags: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
  otpCode?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  authorHandle?: string;
  newsletterOptIn?: boolean;
}
