import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, Bookmark, Info, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JewelryViewport from '../components/configurator/JewelryViewport';
import { MOCK_CATALOG, getProductBySlug } from '../data/mockCatalog';
import { decodeSkuToConfig, encodeSkuFromConfig, METAL_PURITY_LABELS, METAL_COLOR_LABELS, STONE_LABELS, CUT_LABELS, SETTING_LABELS, CATEGORY_LABELS } from '../utils/skuEngine';
import { calculatePriceUSD, formatPrice, formatBNPL, estimatedCompletionDate, CURRENCY_RATES } from '../utils/pricingEngine';
import { useJewelryStore } from '../store/useJewelryStore';
import type { JewelryConfig, MetalPurity, MetalColor, StoneType, Orientation, ViewMode } from '../types/jewelry';

// ─── Ring sizes (UK + US) ────────────────────────────────────
const RING_SIZES = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
const CHAIN_LENGTHS = [16, 18, 20, 22, 24];


// ─── Metal config ─────────────────────────────────────────────
const METAL_PURITIES: MetalPurity[] = ['9K', '14K', '18K', 'PT950'];
const METAL_COLORS: MetalColor[] = ['YG', 'WG', 'RG', 'PT'];

const METAL_SWATCH: Record<MetalColor, [string, string]> = {
  YG: ['#E8C97A', '#C5A848'],
  WG: ['#EFEFEF', '#C8C8C8'],
  RG: ['#E8A87A', '#C57848'],
  PT: ['#E0E0F0', '#B0B0D0'],
};

// ─── Stone types & cuts ───────────────────────────────────────
const STONE_COLORS_UI: Record<StoneType, string> = {
  WLD: '#E8E8F8',
  NTD: '#FFFFF0',
  SAP: '#3A6DBF',
  EMR: '#2D8A5A',
  RBY: '#CC2244',
  AQM: '#6AC8E8',
  MRG: '#E890B0',
  OPA: '#E8D0F8',
};



// ─── Save design modal ────────────────────────────────────────
function SaveDesignModal({ onSave, onClose }: { onSave: (handle: string) => void; onClose: () => void }) {
  const [handle, setHandle] = useState('@');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(20,20,19,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm p-8 relative"
        style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-40 hover:opacity-100"><X size={18} /></button>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
          Save to My Designs
        </h3>
        <p className="text-sm mt-2 mb-6" style={{ color: 'var(--color-stone)' }}>
          Choose your author handle — your design will be saved and shareable with this identity.
        </p>
        <label className="section-label block mb-2">Your Author Handle</label>
        <input
          className="input-underline mb-6"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@yourhandle"
        />
        <button
          onClick={() => onSave(handle)}
          className="w-full py-3 text-[0.7rem] tracking-widest uppercase font-mono"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          Save Design
        </button>
      </motion.div>
    </div>
  );
}

// ─── Size kit modal ───────────────────────────────────────────
function SizingKitModal({ onClose, onAddToCart }: { onClose: () => void; onAddToCart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(20,20,19,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 relative"
        style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-40 hover:opacity-100"><X size={18} /></button>
        <p className="section-label mb-2" style={{ color: 'var(--color-champagne)' }}>Find Your Perfect Size</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
          Heirest Ring Sizing Kit
        </h3>
        <p className="text-sm mt-3 mb-6 leading-relaxed" style={{ color: 'var(--color-stone)' }}>
          Our precision aluminium sizer set includes 12 half-size rings from D to T (UK sizing). 
          The $19 is fully redeemable as a store credit on any ring purchase — essentially free.
        </p>
        <ul className="space-y-2 mb-6">
          {['12 precision half-sizes (D–T UK)', 'Comfortable aluminium', '$19 fully redeemable as credit', 'Free standard shipping'].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-espresso)' }}>
              <Check size={14} style={{ color: 'var(--color-champagne)' }} />
              {item}
            </li>
          ))}
        </ul>
        <button
          onClick={onAddToCart}
          className="w-full py-3 text-[0.7rem] tracking-widest uppercase font-mono"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          Add Sizing Kit — $19
        </button>
      </motion.div>
    </div>
  );
}

export default function ConfiguratorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { currency, addToCart, saveDesign } = useJewelryStore();

  const product = slug ? getProductBySlug(slug) : MOCK_CATALOG[0];

  // Build initial config from URL SKU param or product default
  const initConfig = useCallback((): JewelryConfig => {
    const skuParam = searchParams.get('sku');
    if (skuParam && product) {
      const decoded = decodeSkuToConfig(skuParam);
      if (decoded) return { ...product.defaultConfig, ...decoded };
    }
    return product?.defaultConfig ?? MOCK_CATALOG[0].defaultConfig;
  }, [product, searchParams]);

  const [config, setConfig] = useState<JewelryConfig>(initConfig);
  const [viewMode, setViewMode] = useState<ViewMode>('front');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSizingKit, setShowSizingKit] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Re-init when slug or sku changes
  useEffect(() => {
    setConfig(initConfig());
  }, [initConfig]);

  if (!product) {
    return (
      <div className="max-w-screen-xl mx-auto px-8 py-20 text-center">
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-espresso)' }}>Product not found</p>
        <Link to="/collections/all" className="mt-4 inline-block section-label underline" style={{ color: 'var(--color-stone)' }}>
          Back to collection
        </Link>
      </div>
    );
  }

  const sku = encodeSkuFromConfig(config);
  const priceUSD = calculatePriceUSD(config, product.baseCraftsmanshipFee, product.metalWeightGrams);
  const completion = estimatedCompletionDate(config);

  const update = (patch: Partial<JewelryConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const handleAddToCart = () => {
    addToCart(product.id, config);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleSave = (handle: string) => {
    saveDesign(product.id, product.name, config, handle);
    setShowSaveModal(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8 animate-fade-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 section-label" style={{ color: 'var(--color-stone)' }}>
        <Link to="/collections/all" className="hover:opacity-60 transition-opacity">Collection</Link>
        <span>/</span>
        <Link to={`/collections/${product.category.toLowerCase()}`} className="hover:opacity-60 transition-opacity">
          {CATEGORY_LABELS[product.category]}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--color-espresso)' }}>{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 xl:gap-14">

        {/* ── LEFT: Viewport (sticky) ─────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <JewelryViewport config={config} viewMode={viewMode} onViewModeChange={setViewMode} />

          {/* Current SKU display */}
          <div
            className="mt-4 p-3 flex items-center justify-between"
            style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
          >
            <div>
              <p className="section-label mb-0.5">Authored SKU</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-espresso)', letterSpacing: '0.1em' }}>
                {sku}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(sku)}
              className="text-[0.6rem] tracking-widest uppercase font-mono opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-stone)' }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* ── RIGHT: Controls ─────────────────────────────── */}
        <div className="space-y-8">
          {/* Product header */}
          <div>
            <p className="section-label mb-1" style={{ color: 'var(--color-champagne)' }}>
              {CATEGORY_LABELS[product.category]}
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              {product.name}
            </h1>
            <p className="mt-2 leading-relaxed" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
              {product.shortDescription}
            </p>
          </div>

          {/* ─ Metal Purity ─────────────────────────────────── */}
          <ConfigSection title="Metal Purity">
            <div className="flex flex-wrap gap-2">
              {METAL_PURITIES.filter(p => product.availableMetals.includes(p)).map((purity) => (
                <button
                  key={purity}
                  onClick={() => update({ metalPurity: purity })}
                  className="px-4 py-2 text-[0.7rem] tracking-widest uppercase font-mono transition-all border"
                  style={{
                    borderColor: config.metalPurity === purity ? 'var(--color-espresso)' : 'var(--color-hairline)',
                    backgroundColor: config.metalPurity === purity ? 'var(--color-espresso)' : 'transparent',
                    color: config.metalPurity === purity ? 'var(--color-ivory)' : 'var(--color-stone)',
                  }}
                >
                  {METAL_PURITY_LABELS[purity]}
                </button>
              ))}
            </div>
          </ConfigSection>

          {/* ─ Metal Color ─────────────────────────────────── */}
          <ConfigSection title="Metal Color">
            <div className="flex gap-4">
              {METAL_COLORS.filter(mc => product.availableMetalColors.includes(mc)).map((mc) => (
                <button
                  key={mc}
                  onClick={() => update({ metalColor: mc })}
                  title={METAL_COLOR_LABELS[mc]}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${METAL_SWATCH[mc][0]}, ${METAL_SWATCH[mc][1]})`,
                      border: `3px solid ${config.metalColor === mc ? 'var(--color-espresso)' : 'transparent'}`,
                      outline: config.metalColor === mc ? '1px solid var(--color-hairline)' : 'none',
                      outlineOffset: '3px',
                    }}
                  />
                  <span
                    className="text-[0.6rem] tracking-widest uppercase font-mono"
                    style={{ color: config.metalColor === mc ? 'var(--color-espresso)' : 'var(--color-stone)' }}
                  >
                    {mc}
                  </span>
                </button>
              ))}
            </div>
          </ConfigSection>

          {/* ─ Stone Type ──────────────────────────────────── */}
          <ConfigSection title="Stone & Origin">
            <div className="grid grid-cols-2 gap-2">
              {product.availableStones.map((stone) => (
                <button
                  key={stone}
                  onClick={() => update({ stone })}
                  className="flex items-center gap-3 px-3 py-2.5 border transition-all text-left"
                  style={{
                    borderColor: config.stone === stone ? 'var(--color-espresso)' : 'var(--color-hairline)',
                    backgroundColor: config.stone === stone ? 'var(--color-espresso)' : 'var(--color-ivory)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STONE_COLORS_UI[stone] }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      color: config.stone === stone ? 'var(--color-ivory)' : 'var(--color-espresso)',
                    }}
                  >
                    {STONE_LABELS[stone]}
                  </span>
                </button>
              ))}
            </div>
          </ConfigSection>

          {/* ─ Stone Cut ───────────────────────────────────── */}
          <ConfigSection title="Stone Cut">
            <div className="flex flex-wrap gap-2">
              {product.availableCuts.map((cut) => (
                <button
                  key={cut}
                  onClick={() => update({ cut })}
                  className="px-3 py-2 text-[0.65rem] tracking-wide uppercase font-mono border transition-all"
                  style={{
                    borderColor: config.cut === cut ? 'var(--color-espresso)' : 'var(--color-hairline)',
                    backgroundColor: config.cut === cut ? 'var(--color-espresso)' : 'transparent',
                    color: config.cut === cut ? 'var(--color-ivory)' : 'var(--color-stone)',
                  }}
                >
                  {CUT_LABELS[cut]}
                </button>
              ))}
            </div>
          </ConfigSection>

          {/* ─ Carat Weight ────────────────────────────────── */}
          <ConfigSection title={`Total Carat Weight — ${config.caratWeight.toFixed(2)}ct`}>
            <div className="flex flex-wrap gap-2">
              {product.availableCaratWeights.map((ct) => (
                <button
                  key={ct}
                  onClick={() => update({ caratWeight: ct })}
                  className="px-3 py-2 text-[0.65rem] tracking-wide font-mono border transition-all"
                  style={{
                    borderColor: config.caratWeight === ct ? 'var(--color-espresso)' : 'var(--color-hairline)',
                    backgroundColor: config.caratWeight === ct ? 'var(--color-espresso)' : 'transparent',
                    color: config.caratWeight === ct ? 'var(--color-ivory)' : 'var(--color-stone)',
                  }}
                >
                  {ct.toFixed(2)}ct
                </button>
              ))}
            </div>
          </ConfigSection>

          {/* ─ Setting Style ───────────────────────────────── */}
          <ConfigSection title="Setting Style">
            <div className="flex flex-wrap gap-2">
              {product.availableSettings.map((setting) => (
                <button
                  key={setting}
                  onClick={() => update({ setting })}
                  className="px-3 py-2 text-[0.65rem] tracking-wide uppercase font-mono border transition-all"
                  style={{
                    borderColor: config.setting === setting ? 'var(--color-espresso)' : 'var(--color-hairline)',
                    backgroundColor: config.setting === setting ? 'var(--color-espresso)' : 'transparent',
                    color: config.setting === setting ? 'var(--color-ivory)' : 'var(--color-stone)',
                  }}
                >
                  {SETTING_LABELS[setting]}
                </button>
              ))}
            </div>

            {/* Orientation (for pendants) */}
            {product.category === 'PD' && (
              <div className="mt-3">
                <p className="section-label mb-2">Orientation</p>
                <div className="flex gap-2">
                  {(['NS', 'EW'] as Orientation[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => update({ orientation: o })}
                      className="px-4 py-2 text-[0.65rem] tracking-widest uppercase font-mono border transition-all"
                      style={{
                        borderColor: config.orientation === o ? 'var(--color-espresso)' : 'var(--color-hairline)',
                        backgroundColor: config.orientation === o ? 'var(--color-espresso)' : 'transparent',
                        color: config.orientation === o ? 'var(--color-ivory)' : 'var(--color-stone)',
                      }}
                    >
                      {o === 'NS' ? 'North–South' : 'East–West'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ConfigSection>

          {/* ─ Ring Size / Chain Length ─────────────────────── */}
          {product.category === 'RG' && (
            <ConfigSection title="Ring Size">
              <div className="flex flex-wrap gap-1.5">
                {RING_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => update({ ringSize: size })}
                    className="w-9 h-9 text-xs font-mono border transition-all"
                    style={{
                      borderColor: config.ringSize === size ? 'var(--color-espresso)' : 'var(--color-hairline)',
                      backgroundColor: config.ringSize === size ? 'var(--color-espresso)' : 'transparent',
                      color: config.ringSize === size ? 'var(--color-ivory)' : 'var(--color-stone)',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSizingKit(true)}
                className="mt-3 flex items-center gap-2 text-[0.65rem] tracking-widest uppercase font-mono transition-opacity hover:opacity-60"
                style={{ color: 'var(--color-champagne)' }}
              >
                <Info size={12} />
                Find Your Size — $19 Sizing Kit (redeemable)
              </button>
            </ConfigSection>
          )}

          {(product.category === 'PD' || product.category === 'NK') && (
            <ConfigSection title="Chain Length">
              <div className="flex flex-wrap gap-2">
                {CHAIN_LENGTHS.map((len) => (
                  <button
                    key={len}
                    onClick={() => update({ chainLength: len })}
                    className="px-4 py-2 text-[0.65rem] tracking-widest font-mono border transition-all"
                    style={{
                      borderColor: config.chainLength === len ? 'var(--color-espresso)' : 'var(--color-hairline)',
                      backgroundColor: config.chainLength === len ? 'var(--color-espresso)' : 'transparent',
                      color: config.chainLength === len ? 'var(--color-ivory)' : 'var(--color-stone)',
                    }}
                  >
                    {len}"
                  </button>
                ))}
              </div>
            </ConfigSection>
          )}

          {/* ─ Laser Engraving ─────────────────────────────── */}
          <ConfigSection title="Custom Laser Engraving (optional)">
            <input
              type="text"
              maxLength={30}
              placeholder="E.g. Always & Forever, 14.08.24, initials..."
              className="input-underline"
              value={config.engraving ?? ''}
              onChange={(e) => update({ engraving: e.target.value || undefined })}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
              {30 - (config.engraving?.length ?? 0)} characters remaining
            </p>
          </ConfigSection>

          {/* ─ Currency note ─────────────────────────────────── */}
          <div className="section-label" style={{ color: 'var(--color-stone)' }}>
            Prices shown in {CURRENCY_RATES.find(r => r.code === currency)?.name ?? 'USD'}
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom Summary Bar ─────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 md:px-8 py-4 border-t"
        style={{ backgroundColor: 'var(--color-alabaster)', borderColor: 'var(--color-hairline)', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                {formatPrice(priceUSD, currency)}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
                or 4× {formatBNPL(priceUSD, currency)}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
              Est. completion: {completion}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-4 py-3 border text-[0.65rem] tracking-widest uppercase font-mono transition-all hover:border-[var(--color-espresso)]"
              style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-espresso)' }}
            >
              <Bookmark size={14} />
              {savedFeedback ? 'Saved!' : 'Save Design'}
            </button>
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-6 py-3 text-[0.65rem] tracking-widest uppercase font-mono transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
            >
              <ShoppingBag size={14} />
              {addedFeedback ? <><Check size={14} /> Added!</> : 'Add to Bag'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom spacer so content isn't hidden behind sticky bar */}
      <div className="h-24" />

      {/* Modals */}
      <AnimatePresence>
        {showSaveModal && <SaveDesignModal onSave={handleSave} onClose={() => setShowSaveModal(false)} />}
        {showSizingKit && (
          <SizingKitModal
            onClose={() => setShowSizingKit(false)}
            onAddToCart={() => {
              addToCart('sizing-kit', { ...config, quantity: 1 });
              setShowSizingKit(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────
function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-6" style={{ borderColor: 'var(--color-hairline)' }}>
      <p className="section-label mb-4">{title.toUpperCase()}</p>
      {children}
    </div>
  );
}
