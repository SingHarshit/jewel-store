import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShieldCheck, Truck, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJewelryStore } from '../../store/useJewelryStore';
import { formatPrice, formatBNPL } from '../../utils/pricingEngine';
import {
  CATEGORY_LABELS,
  STONE_LABELS,
  METAL_COLOR_LABELS,
  METAL_PURITY_LABELS,
  CUT_LABELS,
} from '../../utils/skuEngine';

export default function CartDrawer() {
  const {
    isCartOpen, cartClose, cart, removeFromCart, updateCartItemQty,
    clearCart, currency, addToCart, checkoutOpen,
  } = useJewelryStore();

  const subtotalUSD = cart.reduce((s, i) => s + i.priceUSD * i.quantity, 0);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cartClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [cartClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  const addSizingKit = () => {
    if (cart.some((i) => i.productId === 'sizing-kit')) return;
    addToCart('sizing-kit', {
      category: 'RG', style: 'SL', setting: 'BEZ', cut: 'RND',
      caratWeight: 0, metalPurity: '9K', metalColor: 'YG',
      stone: 'WLD', orientation: 'NS', stoneCount: 0, quantity: 1,
    });
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={cartClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed right-0 top-0 h-full w-full max-w-md flex flex-col z-50 shadow-2xl"
            style={{ backgroundColor: 'var(--color-alabaster)' }}
            aria-label="Shopping cart"
            role="dialog"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: 'var(--color-hairline)' }}
            >
              <div>
                <h2 className="text-2xl font-light" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)' }}>
                  Your Bag
                </h2>
                <p className="section-label mt-0.5">{cart.length} {cart.length === 1 ? 'piece' : 'pieces'}</p>
              </div>
              <button onClick={cartClose} className="p-2 hover:opacity-60 transition-opacity" aria-label="Close cart">
                <X size={20} style={{ color: 'var(--color-espresso)' }} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}>
                    <Star size={28} style={{ color: 'var(--color-champagne)' }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                    Your bag is empty
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-stone)' }}>
                    Begin with the Configurator to author your piece.
                  </p>
                  <Link
                    to="/collections/all"
                    onClick={cartClose}
                    className="mt-2 px-6 py-3 text-[0.7rem] tracking-widest uppercase transition-all"
                    style={{
                      backgroundColor: 'var(--color-espresso)',
                      color: 'var(--color-ivory)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Explore Collection
                  </Link>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-5 border-b"
                      style={{ borderColor: 'var(--color-hairline)' }}
                    >
                      {/* Item visual placeholder */}
                      <div
                        className="w-20 h-20 flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
                      >
                        <JewelryMiniPreview category={item.config.category} metalColor={item.config.metalColor} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                          {CATEGORY_LABELS[item.config.category]} — {CUT_LABELS[item.config.cut]}
                        </p>
                        <div className="sku-badge mt-1">{item.sku}</div>
                        <p className="text-xs mt-2" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}>
                          {METAL_PURITY_LABELS[item.config.metalPurity]} {METAL_COLOR_LABELS[item.config.metalColor]}&nbsp;·&nbsp;
                          {item.config.caratWeight.toFixed(2)}ct {STONE_LABELS[item.config.stone]}
                        </p>
                        {item.engraving && (
                          <p className="text-xs mt-1 italic" style={{ color: 'var(--color-stone)' }}>
                            Engraving: "{item.engraving}"
                          </p>
                        )}

                        {/* Qty + remove */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center border hover:border-[var(--color-champagne)] transition-colors"
                              style={{ borderColor: 'var(--color-hairline)' }}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center border hover:border-[var(--color-champagne)] transition-colors"
                              style={{ borderColor: 'var(--color-hairline)' }}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--color-espresso)' }}>
                              {formatPrice(item.priceUSD * item.quantity, currency)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="opacity-40 hover:opacity-100 transition-opacity"
                              aria-label="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Sizing kit upsell */}
                  {!cart.some((i) => i.productId === 'sizing-kit') && (
                    <div
                      className="p-4 flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
                    >
                      <div>
                        <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--color-champagne)' }}>
                          Add to Order
                        </p>
                        <p className="text-sm mt-0.5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)' }}>
                          Heirest Ring Sizing Kit
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-stone)' }}>
                          $19 — fully redeemable as credit
                        </p>
                      </div>
                      <button
                        onClick={addSizingKit}
                        className="px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all border hover:bg-[var(--color-espresso)] hover:text-[var(--color-ivory)]"
                        style={{ borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)' }}
                      >
                        Add $19
                      </button>
                    </div>
                  )}

                  {/* Order notes */}
                  <div>
                    <label className="section-label block mb-2">Order Notes</label>
                    <textarea
                      className="input-underline resize-none"
                      rows={2}
                      placeholder="Special requests, gift messages, occasion notes..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t" style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}>
                {/* Trust badges */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-stone)' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--color-champagne)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
                      LIFETIME WARRANTY
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-stone)' }}>
                    <Truck size={14} style={{ color: 'var(--color-champagne)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
                      FREE INSURED SHIPPING
                    </span>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex items-baseline justify-between mb-1">
                  <span className="section-label">Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                    {formatPrice(subtotalUSD, currency)}
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
                  Or 4× {formatBNPL(subtotalUSD, currency)} interest-free with Afterpay
                </p>

                <button
                  onClick={() => checkoutOpen()}
                  className="w-full py-4 text-[0.75rem] tracking-[0.15em] uppercase font-mono transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => { clearCart(); cartClose(); }}
                  className="w-full mt-2 py-2 text-[0.65rem] tracking-widest uppercase font-mono opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-espresso)' }}
                >
                  Clear Bag
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mini SVG preview inside cart ──────────────────────────────
function JewelryMiniPreview({ category, metalColor }: { category: string; metalColor: string }) {
  const metalColors: Record<string, string[]> = {
    YG: ['#E8C97A', '#C5A848'],
    WG: ['#D8D8D8', '#A8A8A8'],
    RG: ['#E8A87A', '#C57848'],
    PT: ['#D0D0D8', '#9898A8'],
  };
  const [grad1, grad2] = metalColors[metalColor] ?? ['#C5A880', '#8B7355'];

  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <defs>
        <radialGradient id={`mg-${metalColor}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={grad1} />
          <stop offset="100%" stopColor={grad2} />
        </radialGradient>
      </defs>
      {category === 'RG' ? (
        <ellipse cx="40" cy="40" rx="22" ry="8" fill="none" stroke={`url(#mg-${metalColor})`} strokeWidth="6" />
      ) : category === 'PD' ? (
        <circle cx="40" cy="44" r="10" fill="none" stroke={`url(#mg-${metalColor})`} strokeWidth="5" />
      ) : category === 'ER' ? (
        <circle cx="40" cy="40" r="12" fill={`url(#mg-${metalColor})`} />
      ) : (
        <rect x="14" y="36" width="52" height="8" rx="4" fill={`url(#mg-${metalColor})`} />
      )}
    </svg>
  );
}
