import { useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { MOCK_CATALOG } from '../data/mockCatalog';
import { formatPrice } from '../utils/pricingEngine';
import { useJewelryStore } from '../store/useJewelryStore';
import { METAL_COLOR_LABELS } from '../utils/skuEngine';
import type { JewelryProduct, MetalColor, StoneCut, SettingStyle } from '../types/jewelry';

// ─── Filter definitions ──────────────────────────────────────
const METAL_FILTERS: { label: string; value: MetalColor }[] = [
  { label: 'Yellow Gold', value: 'YG' },
  { label: 'White Gold', value: 'WG' },
  { label: 'Rose Gold', value: 'RG' },
  { label: 'Platinum', value: 'PT' },
];
const CUT_FILTERS: { label: string; value: StoneCut }[] = [
  { label: 'Round', value: 'RND' },
  { label: 'Oval', value: 'OV' },
  { label: 'Emerald Cut', value: 'EMC' },
  { label: 'Pear', value: 'PR' },
  { label: 'Heart', value: 'HT' },
  { label: 'Marquise', value: 'MQ' },
];
const SETTING_FILTERS: { label: string; value: SettingStyle }[] = [
  { label: 'Claw', value: 'CLW' },
  { label: 'Bezel', value: 'BEZ' },
  { label: 'Georgian Collet', value: 'COL' },
  { label: 'Pavé', value: 'PAV' },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'New Arrivals', value: 'new' },
];

const CATEGORY_LABELS_MAP: Record<string, string> = {
  all: 'All Jewellery',
  rings: 'Rings',
  pendants: 'Pendants',
  earrings: 'Earrings',
  bracelets: 'Bracelets',
};

export default function CollectionPage() {
  const { category = 'all' } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const { currency } = useJewelryStore();

  const [selectedMetals, setSelectedMetals] = useState<MetalColor[]>([]);
  const [selectedCuts, setSelectedCuts] = useState<StoneCut[]>([]);
  const [selectedSettings, setSelectedSettings] = useState<SettingStyle[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [filterOpen, setFilterOpen] = useState(false);

  const stoneParam = searchParams.get('stone');

  const products = useMemo(() => {
    let list: JewelryProduct[] = MOCK_CATALOG;

    // Category filter
    if (category !== 'all') {
      const catCode = category.slice(0, 2).toUpperCase();
      list = list.filter((p) => p.category === catCode);
    }

    // Stone URL param
    if (stoneParam) {
      list = list.filter((p) => p.availableStones.includes(stoneParam as any));
    }

    // Metal filter
    if (selectedMetals.length > 0) {
      list = list.filter((p) => selectedMetals.some((m) => p.availableMetalColors.includes(m)));
    }

    // Cut filter
    if (selectedCuts.length > 0) {
      list = list.filter((p) => selectedCuts.some((c) => p.availableCuts.includes(c)));
    }

    // Setting filter
    if (selectedSettings.length > 0) {
      list = list.filter((p) => selectedSettings.some((s) => p.availableSettings.includes(s)));
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.baseCraftsmanshipFee - b.baseCraftsmanshipFee);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.baseCraftsmanshipFee - a.baseCraftsmanshipFee);
        break;
      case 'new':
        list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return list;
  }, [category, selectedMetals, selectedCuts, selectedSettings, sortBy, stoneParam]);

  const toggleFilter = <T,>(arr: T[], setArr: (v: T[]) => void, val: T) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearAllFilters = () => {
    setSelectedMetals([]);
    setSelectedCuts([]);
    setSelectedSettings([]);
  };

  const hasFilters = selectedMetals.length + selectedCuts.length + selectedSettings.length > 0;

  // Sub-category pills
  const subCategories = [
    { label: 'All', href: '/collections/all' },
    { label: 'Rings', href: '/collections/rings' },
    { label: 'Pendants', href: '/collections/pendants' },
    { label: 'Earrings', href: '/collections/earrings' },
    { label: 'Bracelets', href: '/collections/bracelets' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 animate-fade-up">
      {/* Page heading */}
      <div className="mb-8">
        <p className="section-label mb-2">Heirest Collection</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
          {CATEGORY_LABELS_MAP[category] ?? 'Collection'}
        </h1>
      </div>

      {/* Sub-category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {subCategories.map((sc) => (
          <Link
            key={sc.href}
            to={sc.href}
            className="px-4 py-2 text-[0.7rem] tracking-widest uppercase font-mono transition-all border"
            style={{
              borderColor: category === sc.label.toLowerCase() || (sc.label === 'All' && category === 'all')
                ? 'var(--color-espresso)' : 'var(--color-hairline)',
              backgroundColor: category === sc.label.toLowerCase() || (sc.label === 'All' && category === 'all')
                ? 'var(--color-espresso)' : 'transparent',
              color: category === sc.label.toLowerCase() || (sc.label === 'All' && category === 'all')
                ? 'var(--color-ivory)' : 'var(--color-stone)',
            }}
          >
            {sc.label}
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center justify-between mb-6 py-4 border-y"
        style={{ borderColor: 'var(--color-hairline)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 text-[0.7rem] tracking-widest uppercase font-mono transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-espresso)' }}
          >
            <SlidersHorizontal size={14} />
            Filter {hasFilters && `(${selectedMetals.length + selectedCuts.length + selectedSettings.length})`}
          </button>
          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[0.65rem] tracking-widest uppercase font-mono opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-stone)' }}
            >
              <X size={10} /> Clear All
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="section-label hidden md:block">{products.length} pieces</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[0.7rem] tracking-widest uppercase font-mono bg-transparent border-none outline-none cursor-pointer"
            style={{ color: 'var(--color-espresso)' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div
          className="mb-8 p-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-b"
          style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
        >
          <div>
            <p className="section-label mb-3">Metal Color</p>
            <div className="flex flex-col gap-2">
              {METAL_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFilter(selectedMetals, setSelectedMetals, f.value)}
                  className="flex items-center gap-2 text-sm text-left transition-opacity hover:opacity-70"
                  style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-espresso)' }}
                >
                  <div
                    className="w-4 h-4 border flex items-center justify-center"
                    style={{
                      borderColor: selectedMetals.includes(f.value) ? 'var(--color-espresso)' : 'var(--color-hairline)',
                      backgroundColor: selectedMetals.includes(f.value) ? 'var(--color-espresso)' : 'transparent',
                    }}
                  >
                    {selectedMetals.includes(f.value) && <X size={8} color="white" />}
                  </div>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="section-label mb-3">Stone Shape</p>
            <div className="flex flex-col gap-2">
              {CUT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFilter(selectedCuts, setSelectedCuts, f.value)}
                  className="flex items-center gap-2 text-sm text-left transition-opacity hover:opacity-70"
                  style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-espresso)' }}
                >
                  <div
                    className="w-4 h-4 border flex items-center justify-center"
                    style={{
                      borderColor: selectedCuts.includes(f.value) ? 'var(--color-espresso)' : 'var(--color-hairline)',
                      backgroundColor: selectedCuts.includes(f.value) ? 'var(--color-espresso)' : 'transparent',
                    }}
                  >
                    {selectedCuts.includes(f.value) && <X size={8} color="white" />}
                  </div>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="section-label mb-3">Setting Style</p>
            <div className="flex flex-col gap-2">
              {SETTING_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFilter(selectedSettings, setSelectedSettings, f.value)}
                  className="flex items-center gap-2 text-sm text-left transition-opacity hover:opacity-70"
                  style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-espresso)' }}
                >
                  <div
                    className="w-4 h-4 border flex items-center justify-center"
                    style={{
                      borderColor: selectedSettings.includes(f.value) ? 'var(--color-espresso)' : 'var(--color-hairline)',
                      backgroundColor: selectedSettings.includes(f.value) ? 'var(--color-espresso)' : 'transparent',
                    }}
                  >
                    {selectedSettings.includes(f.value) && <X size={8} color="white" />}
                  </div>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
            No pieces match your filters
          </p>
          <button onClick={clearAllFilters} className="mt-4 section-label underline" style={{ color: 'var(--color-stone)' }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────
function ProductCard({ product, currency }: { product: JewelryProduct; currency: string }) {
  const [hovered, setHovered] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<MetalColor>(product.defaultConfig.metalColor);

  const metalSwatchColors: Record<MetalColor, string> = {
    YG: '#C5A848',
    WG: '#D0D0D0',
    RG: '#C57848',
    PT: '#A0A0B0',
  };

  return (
    <div
      className="group border transition-all"
      style={{
        borderColor: hovered ? 'var(--color-champagne)' : 'var(--color-hairline)',
        backgroundColor: 'var(--color-alabaster)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area */}
      <div
        className="aspect-square relative overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: product.imagePlaceholderColor + '18' }}
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.isNew && (
            <span className="sku-badge" style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)', borderColor: 'var(--color-espresso)' }}>
              New
            </span>
          )}
          {product.isBestseller && (
            <span className="sku-badge" style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)', borderColor: 'var(--color-champagne)' }}>
              Bestseller
            </span>
          )}
        </div>

        {/* Product visual */}
        <div
          className="w-24 h-24 rounded-full transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundColor: product.imagePlaceholderColor + '55' }}
        />

        {/* Customize overlay on hover */}
        <div
          className="absolute inset-0 flex items-end justify-center pb-4 transition-opacity"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <Link
            to={`/configure/${product.slug}`}
            className="px-6 py-2.5 text-[0.65rem] tracking-widest uppercase font-mono transition-all"
            style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
          >
            Customize
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Metal swatches */}
        <div className="flex gap-2 mb-3">
          {product.availableMetalColors.slice(0, 4).map((mc) => (
            <button
              key={mc}
              onClick={() => setSelectedMetal(mc)}
              title={METAL_COLOR_LABELS[mc]}
              className="w-4 h-4 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: metalSwatchColors[mc],
                border: `2px solid ${selectedMetal === mc ? 'var(--color-espresso)' : 'transparent'}`,
                outline: selectedMetal === mc ? '1px solid var(--color-hairline)' : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
          {product.name}
        </p>
        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}>
          {product.shortDescription}
        </p>

        {/* SKU */}
        <div className="sku-badge mt-2">
          {product.category}-{product.style}-{product.defaultConfig.setting}-{product.defaultConfig.cut}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-espresso)' }}>
            From {formatPrice(product.baseCraftsmanshipFee, currency as any)}
          </p>
          <Link
            to={`/configure/${product.slug}`}
            className="text-[0.65rem] tracking-widest uppercase font-mono transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-champagne)' }}
          >
            Configure →
          </Link>
        </div>
      </div>
    </div>
  );
}
