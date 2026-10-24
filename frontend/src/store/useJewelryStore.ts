import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem,
  SavedDesign,
  VaultItem,
  Order,
  OrderStage,
  UserProfile,
  JewelryConfig,
  JewelryProduct,
  Currency,
  AccountTab,
  User,
  PricingRates,
  CmsSettings,
  CommunityDesign,
} from '../types/jewelry';
import { encodeSkuFromConfig } from '../utils/skuEngine';
import { PRICING_RATES } from '../utils/pricingEngine';
import {
  MOCK_SAVED_DESIGNS,
  MOCK_VAULT_ITEMS,
  MOCK_ORDERS,
  MOCK_USER_PROFILE,
} from '../data/mockUserData';
import { MOCK_CATALOG, COMMUNITY_DESIGNS } from '../data/mockCatalog';
import { authApi } from '../services/api';

export type AuthModalView = 'login' | 'register' | 'forgot-password' | 'magic-otp';

const DEFAULT_CMS_SETTINGS: CmsSettings = {
  announcementBarVisible: true,
  announcementBarText: 'SHOP THE HEIREST SIZING KIT · ONLY $19 + FREE SHIPPING (REDEEMABLE CREDIT)',
  sizingKitPrice: 19,
  heroHeadline: 'Author Your\nHeirloom.',
  heroSubheadline: 'Bespoke fine jewellery, configured by you. Crafted by master jewellers. Yours forever.',
  heroMediaUrl: '',
};

// ---------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------
interface JewelryStore {
  // UI state
  isCartOpen: boolean;
  isSearchOpen: boolean;
  currency: Currency;
  activeAccountTab: AccountTab;

  // ── Auth ──────────────────────────────────────────────────────
  authUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authModalOpen: boolean;
  authModalView: AuthModalView;
  postAuthRedirect: string | null;

  openAuthModal: (view?: AuthModalView, redirect?: string) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;

  /** Called after successful login / register — merges guest data */
  onAuthSuccess: (user: User, token: string) => void;

  /** Sign out and clear session */
  signOut: () => void;

  /** Hydrate auth from localStorage on app start */
  hydrateAuth: () => void;

  // ── Cart ──────────────────────────────────────────────────────
  cart: CartItem[];
  cartOpen: () => void;
  cartClose: () => void;
  addToCart: (productId: string, config: JewelryConfig) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;

  // ── Search ────────────────────────────────────────────────────
  searchOpen: () => void;
  searchClose: () => void;

  // ── Currency ──────────────────────────────────────────────────
  setCurrency: (currency: Currency) => void;

  // ── Account tab ───────────────────────────────────────────────
  setActiveAccountTab: (tab: AccountTab) => void;

  // ── Saved Designs ─────────────────────────────────────────────
  savedDesigns: SavedDesign[];
  saveDesign: (productId: string, productName: string, config: JewelryConfig, handle: string) => void;
  removeDesign: (id: string) => void;

  // ── Vault ─────────────────────────────────────────────────────
  vaultItems: VaultItem[];

  // ── Orders ────────────────────────────────────────────────────
  orders: Order[];
  approveCadRender: (orderId: string) => void;

  // ── Legacy user profile (sizing / chain prefs) ────────────────
  user: UserProfile;
  updateFingerSize: (hand: 'left' | 'right', finger: string, size: string) => void;
  redeemSizingKit: () => void;

  // ── Admin: Catalog ────────────────────────────────────────────
  catalog: JewelryProduct[];
  adminAddProduct: (product: JewelryProduct) => void;
  adminUpdateProduct: (id: string, updates: Partial<JewelryProduct>) => void;
  adminDeleteProduct: (id: string) => void;
  adminToggleProductStatus: (id: string) => void;

  // ── Admin: Pricing Matrix ─────────────────────────────────────
  pricingRates: PricingRates;
  adminUpdatePricingRates: (rates: PricingRates) => void;

  // ── Admin: Order Pipeline ─────────────────────────────────────
  adminAdvanceOrderStage: (orderId: string, stage: OrderStage) => void;
  adminAttachCadRender: (orderId: string, cadUrl: string, jewellersNote: string) => void;
  adminIssueCertificate: (orderId: string) => void;

  // ── Admin: CMS Settings ───────────────────────────────────────
  cmsSettings: CmsSettings;
  adminUpdateCmsSettings: (settings: Partial<CmsSettings>) => void;

  // ── Admin: Community Curation ─────────────────────────────────
  communityDesigns: CommunityDesign[];
  adminApproveCommunityDesign: (id: string) => void;
  adminFeatureCommunityDesign: (id: string) => void;
  adminRemoveCommunityDesign: (id: string) => void;
}

// ---------------------------------------------------------------
// Stage ordering helper
// ---------------------------------------------------------------
const STAGE_ORDER: OrderStage[] = [
  'specs_locked', 'cad_approval', 'metal_casting',
  'stone_selection', 'master_setting', 'hand_polishing',
  'quality_control', 'dispatched',
];

const STAGE_LABELS: Record<OrderStage, { label: string; description: string }> = {
  specs_locked: { label: '01. Specs Locked', description: 'Your configuration has been confirmed and sent to our design studio.' },
  cad_approval: { label: '02. 3D CAD Render Approval', description: 'Our master jeweller has created a precision 3D CAD render. Please review and approve before casting begins.' },
  metal_casting: { label: '03. Metal Casting', description: 'Your ring is being cast in solid gold using lost-wax casting by our third-generation craftsmen.' },
  stone_selection: { label: '04. Hand-Picked Stone Selection', description: 'Our gemologist hand-selects your stone from a curated lot to match your specifications precisely.' },
  master_setting: { label: '05. Master Setting', description: 'Your stone is hand-set by our master setter with loupes and precision tools.' },
  hand_polishing: { label: '06. Hand Polishing', description: 'Your piece is brought to a mirror finish using traditional hand-polishing techniques.' },
  quality_control: { label: '07. 8-Point Quality Control', description: 'Independent gemological inspection: stone security, metal integrity, finish, weight, dimensions, engraving, documentation.' },
  dispatched: { label: '08. Insured DHL Express Dispatch', description: 'Your piece ships fully insured via DHL Express with real-time tracking.' },
};

// ---------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------
export const useJewelryStore = create<JewelryStore>()(
  persist(
    (set, get) => ({
      // ── UI ─────────────────────────────────────────────────────
      isCartOpen: false,
      isSearchOpen: false,
      currency: 'USD',
      activeAccountTab: 'designs',

      // ── Auth ───────────────────────────────────────────────────
      authUser: null,
      token: null,
      isAuthenticated: false,
      authModalOpen: false,
      authModalView: 'login',
      postAuthRedirect: null,

      openAuthModal: (view = 'login', redirect) =>
        set({ authModalOpen: true, authModalView: view, postAuthRedirect: redirect ?? null }),

      closeAuthModal: () =>
        set({ authModalOpen: false, postAuthRedirect: null }),

      setAuthModalView: (view) => set({ authModalView: view }),

      onAuthSuccess: (user, token) => {
        const { savedDesigns } = get();
        const mergedDesigns = savedDesigns.map((d) =>
          d.authorHandle === '@me' ? { ...d, authorHandle: user.authorHandle } : d
        );
        localStorage.setItem('heirest-token', token);
        localStorage.setItem('heirest-auth-user', JSON.stringify(user));
        set({
          authUser: user,
          token,
          isAuthenticated: true,
          authModalOpen: false,
          savedDesigns: mergedDesigns,
        });
      },

      signOut: () => {
        authApi.logout();
        set({
          authUser: null,
          token: null,
          isAuthenticated: false,
          authModalOpen: false,
          postAuthRedirect: null,
        });
      },

      hydrateAuth: () => {
        const storedToken = localStorage.getItem('heirest-token');
        const storedUser = localStorage.getItem('heirest-auth-user');
        if (storedToken && storedUser) {
          try {
            const user: User = JSON.parse(storedUser);
            set({ authUser: user, token: storedToken, isAuthenticated: true });
          } catch {
            localStorage.removeItem('heirest-token');
            localStorage.removeItem('heirest-auth-user');
          }
        }
      },

      // ── Cart ───────────────────────────────────────────────────
      cart: [],

      cartOpen: () => set({ isCartOpen: true }),
      cartClose: () => set({ isCartOpen: false }),
      searchOpen: () => set({ isSearchOpen: true }),
      searchClose: () => set({ isSearchOpen: false }),
      setCurrency: (currency) => set({ currency }),
      setActiveAccountTab: (tab) => set({ activeAccountTab: tab }),

      addToCart: (productId, config) => {
        const { catalog } = get();
        const product = catalog.find((p) => p.id === productId);
        if (!product) return;
        const sku = encodeSkuFromConfig(config);
        const { pricingRates } = get();
        const priceUSD = calculatePriceUSDWithRates(
          config,
          product.baseCraftsmanshipFee,
          product.metalWeightGrams,
          pricingRates
        );
        const item: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          productId,
          config,
          sku,
          priceUSD,
          quantity: config.quantity,
          engraving: config.engraving,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ cart: [...state.cart, item], isCartOpen: true }));
      },

      removeFromCart: (itemId) =>
        set((state) => ({ cart: state.cart.filter((i) => i.id !== itemId) })),

      updateCartItemQty: (itemId, qty) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i
          ),
        })),

      clearCart: () => set({ cart: [] }),

      cartTotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);
      },

      cartCount: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      },

      // ── Saved Designs ──────────────────────────────────────────
      savedDesigns: MOCK_SAVED_DESIGNS,

      saveDesign: (productId, productName, config, handle) => {
        const sku = encodeSkuFromConfig(config);
        const { catalog, pricingRates } = get();
        const product = catalog.find((p) => p.id === productId);
        const priceUSD = product
          ? calculatePriceUSDWithRates(config, product.baseCraftsmanshipFee, product.metalWeightGrams, pricingRates)
          : 0;
        const { authUser } = get();
        const finalHandle = authUser ? authUser.authorHandle : handle || '@me';
        const newDesign: SavedDesign = {
          id: `sd-${Date.now()}`,
          productId,
          productName,
          config,
          sku,
          priceUSD,
          savedAt: new Date().toISOString(),
          authorHandle: finalHandle,
          shareUrl: `${window.location.origin}/configure/${product?.slug ?? productId}?sku=${sku}`,
        };
        set((state) => ({ savedDesigns: [newDesign, ...state.savedDesigns] }));
      },

      removeDesign: (id) =>
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((d) => d.id !== id),
        })),

      // ── Vault ──────────────────────────────────────────────────
      vaultItems: MOCK_VAULT_ITEMS,

      // ── Orders ─────────────────────────────────────────────────
      orders: MOCK_ORDERS,

      approveCadRender: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            const updatedStages = o.stages.map((s) =>
              s.stage === 'cad_approval'
                ? { ...s, isActive: false, isPending: false, completedAt: new Date().toISOString(), requiresApproval: false }
                : s.stage === 'metal_casting'
                ? { ...s, isActive: true, isPending: false }
                : s
            );
            return {
              ...o,
              cadRenderApproved: true,
              currentStage: 'metal_casting' as const,
              stages: updatedStages,
            };
          }),
        })),

      // ── Legacy UserProfile (sizing) ────────────────────────────
      user: MOCK_USER_PROFILE,

      updateFingerSize: (hand, finger, size) =>
        set((state) => {
          const existing = state.user.fingerSizes.find(
            (f) => f.hand === hand && f.finger === finger
          );
          const fingerSizes = existing
            ? state.user.fingerSizes.map((f) =>
                f.hand === hand && f.finger === finger ? { ...f, size } : f
              )
            : [
                ...state.user.fingerSizes,
                { hand, finger: finger as any, size },
              ];
          return { user: { ...state.user, fingerSizes } };
        }),

      redeemSizingKit: () =>
        set((state) => ({
          user: { ...state.user, sizingKitRedeemed: true },
        })),

      // ── Admin: Catalog ─────────────────────────────────────────
      catalog: MOCK_CATALOG,

      adminAddProduct: (product) =>
        set((state) => ({ catalog: [...state.catalog, product] })),

      adminUpdateProduct: (id, updates) =>
        set((state) => ({
          catalog: state.catalog.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      adminDeleteProduct: (id) =>
        set((state) => ({ catalog: state.catalog.filter((p) => p.id !== id) })),

      adminToggleProductStatus: (id) =>
        set((state) => ({
          catalog: state.catalog.map((p) =>
            p.id === id ? { ...p, isActive: !(p as any).isActive } : p
          ),
        })),

      // ── Admin: Pricing Matrix ───────────────────────────────────
      pricingRates: PRICING_RATES,

      adminUpdatePricingRates: (rates) => set({ pricingRates: rates }),

      // ── Admin: Order Pipeline ───────────────────────────────────
      adminAdvanceOrderStage: (orderId, stage) =>
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            const stageIdx = STAGE_ORDER.indexOf(stage);
            const updatedStages = o.stages.map((s, i) => ({
              ...s,
              completedAt: i < stageIdx ? (s.completedAt ?? new Date().toISOString()) : undefined,
              isPending: i > stageIdx,
              isActive: i === stageIdx,
              requiresApproval: s.stage === 'cad_approval' && i === stageIdx && !o.cadRenderApproved,
            }));
            return { ...o, currentStage: stage, stages: updatedStages };
          }),
        })),

      adminAttachCadRender: (orderId, cadUrl, jewellersNote) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  cadRenderUrl: cadUrl,
                  cadRenderApproved: false,
                  stages: o.stages.map((s) =>
                    s.stage === 'cad_approval'
                      ? { ...s, isActive: true, isPending: false, requiresApproval: true, description: jewellersNote || s.description }
                      : s
                  ),
                  currentStage: 'cad_approval' as OrderStage,
                }
              : o
          ),
        })),

      adminIssueCertificate: (orderId) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (!order) return state;
          const item = order.items[0];
          if (!item) return state;
          const cert: VaultItem = {
            id: `vi-admin-${Date.now()}`,
            orderId,
            productId: item.productId,
            productName: item.productId,
            sku: item.sku,
            config: item.config,
            purchasedAt: new Date().toISOString(),
            priceUSD: order.totalUSD,
            certificateNumber: `HRS-CERT-${Date.now()}`,
            stoneGradingReport: {
              lab: 'IGI',
              reportNumber: `IGI-${Date.now()}`,
              shape: item.config.cut,
              caratWeight: item.config.caratWeight,
              color: 'D',
              clarity: 'VS2',
              cut: 'Excellent',
              polish: 'Excellent',
              symmetry: 'Excellent',
              fluorescence: 'None',
              measurements: '6.50 × 6.48 × 4.05 mm',
            },
            insuranceValuation: Math.round(order.totalUSD * 1.25),
            resizingUsed: false,
            inspectionDue: new Date(Date.now() + 365 * 86400000).toISOString(),
          };
          return { vaultItems: [...state.vaultItems, cert] };
        }),

      // ── Admin: CMS Settings ─────────────────────────────────────
      cmsSettings: DEFAULT_CMS_SETTINGS,

      adminUpdateCmsSettings: (settings) =>
        set((state) => ({ cmsSettings: { ...state.cmsSettings, ...settings } })),

      // ── Admin: Community Curation ───────────────────────────────
      communityDesigns: COMMUNITY_DESIGNS,

      adminApproveCommunityDesign: (id) =>
        set((state) => ({
          communityDesigns: state.communityDesigns.map((d) =>
            d.id === id ? { ...d, approved: true } : d
          ),
        })),

      adminFeatureCommunityDesign: (id) =>
        set((state) => ({
          communityDesigns: state.communityDesigns.map((d) =>
            d.id === id ? { ...d, featured: true } : d
          ),
        })),

      adminRemoveCommunityDesign: (id) =>
        set((state) => ({
          communityDesigns: state.communityDesigns.filter((d) => d.id !== id),
        })),
    }),
    {
      name: 'heirest-store',
      partialize: (state) => ({
        cart: state.cart,
        savedDesigns: state.savedDesigns,
        orders: state.orders,
        currency: state.currency,
        user: state.user,
        catalog: state.catalog,
        pricingRates: state.pricingRates,
        cmsSettings: state.cmsSettings,
        vaultItems: state.vaultItems,
        communityDesigns: state.communityDesigns,
      }),
    }
  )
);

// ---------------------------------------------------------------
// Helper: price calculator that accepts a custom pricing rates object
// (allows admin pricing matrix changes to propagate immediately)
// ---------------------------------------------------------------
export function calculatePriceUSDWithRates(
  config: JewelryConfig,
  baseCraftsmanshipFee: number,
  metalWeightGrams: number,
  rates: PricingRates
): number {
  const metalCost =
    metalWeightGrams *
    (rates.metalPurityRate[config.metalPurity] ?? 0) *
    (rates.metalColorPremium[config.metalColor] ?? 1);

  const stoneCost =
    config.stoneCount *
    config.caratWeight *
    (rates.stoneTypeRate[config.stone] ?? 0) *
    (rates.cutPremiumMultiplier[config.cut] ?? 1);

  const total = baseCraftsmanshipFee + metalCost + stoneCost;
  return Math.round(total * 100) / 100;
}

// Re-export STAGE_LABELS for admin dashboard use
export { STAGE_ORDER, STAGE_LABELS };
