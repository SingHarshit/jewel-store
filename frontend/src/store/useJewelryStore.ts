import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem,
  SavedDesign,
  VaultItem,
  Order,
  UserProfile,
  JewelryConfig,
  Currency,
  AccountTab,
} from '../types/jewelry';
import { encodeSkuFromConfig } from '../utils/skuEngine';
import { calculatePriceUSD } from '../utils/pricingEngine';
import {
  MOCK_SAVED_DESIGNS,
  MOCK_VAULT_ITEMS,
  MOCK_ORDERS,
  MOCK_USER_PROFILE,
} from '../data/mockUserData';
import { MOCK_CATALOG } from '../data/mockCatalog';

// ---------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------
interface JewelryStore {
  // UI state
  isCartOpen: boolean;
  isSearchOpen: boolean;
  currency: Currency;
  activeAccountTab: AccountTab;

  // Cart
  cart: CartItem[];
  cartOpen: () => void;
  cartClose: () => void;
  addToCart: (productId: string, config: JewelryConfig) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;

  // Search
  searchOpen: () => void;
  searchClose: () => void;

  // Currency
  setCurrency: (currency: Currency) => void;

  // Account
  setActiveAccountTab: (tab: AccountTab) => void;

  // Saved Designs
  savedDesigns: SavedDesign[];
  saveDesign: (productId: string, productName: string, config: JewelryConfig, handle: string) => void;
  removeDesign: (id: string) => void;

  // Vault (purchased - read from mock, approval action)
  vaultItems: VaultItem[];

  // Orders
  orders: Order[];
  approveCadRender: (orderId: string) => void;

  // User
  user: UserProfile;
  updateFingerSize: (hand: 'left' | 'right', finger: string, size: string) => void;
  redeemSizingKit: () => void;
}

// ---------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------
export const useJewelryStore = create<JewelryStore>()(
  persist(
    (set, get) => ({
      // UI
      isCartOpen: false,
      isSearchOpen: false,
      currency: 'USD',
      activeAccountTab: 'designs',

      // ── Cart ──
      cart: [],

      cartOpen: () => set({ isCartOpen: true }),
      cartClose: () => set({ isCartOpen: false }),
      searchOpen: () => set({ isSearchOpen: true }),
      searchClose: () => set({ isSearchOpen: false }),
      setCurrency: (currency) => set({ currency }),
      setActiveAccountTab: (tab) => set({ activeAccountTab: tab }),

      addToCart: (productId, config) => {
        const product = MOCK_CATALOG.find((p) => p.id === productId);
        if (!product) return;
        const sku = encodeSkuFromConfig(config);
        const priceUSD = calculatePriceUSD(
          config,
          product.baseCraftsmanshipFee,
          product.metalWeightGrams
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

      // ── Saved Designs ──
      savedDesigns: MOCK_SAVED_DESIGNS,

      saveDesign: (productId, productName, config, handle) => {
        const sku = encodeSkuFromConfig(config);
        const product = MOCK_CATALOG.find((p) => p.id === productId);
        const priceUSD = product
          ? calculatePriceUSD(config, product.baseCraftsmanshipFee, product.metalWeightGrams)
          : 0;
        const newDesign: SavedDesign = {
          id: `sd-${Date.now()}`,
          productId,
          productName,
          config,
          sku,
          priceUSD,
          savedAt: new Date().toISOString(),
          authorHandle: handle || '@me',
          shareUrl: `${window.location.origin}/configure/${product?.slug ?? productId}?sku=${sku}`,
        };
        set((state) => ({ savedDesigns: [newDesign, ...state.savedDesigns] }));
      },

      removeDesign: (id) =>
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((d) => d.id !== id),
        })),

      // ── Vault ──
      vaultItems: MOCK_VAULT_ITEMS,

      // ── Orders ──
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

      // ── User ──
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
    }),
    {
      name: 'heirest-store',
      partialize: (state) => ({
        cart: state.cart,
        savedDesigns: state.savedDesigns,
        orders: state.orders,
        currency: state.currency,
        user: state.user,
      }),
    }
  )
);
