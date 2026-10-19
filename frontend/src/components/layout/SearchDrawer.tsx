import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJewelryStore } from '../../store/useJewelryStore';
import { MOCK_CATALOG } from '../../data/mockCatalog';
import { decodeSkuToConfig, CUT_LABELS, STONE_LABELS, METAL_COLOR_LABELS } from '../../utils/skuEngine';
import type { JewelryProduct } from '../../types/jewelry';

export default function SearchDrawer() {
  const { isSearchOpen, searchClose } = useJewelryStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') searchClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchClose]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase().trim();

    // Check if it looks like an SKU
    const skuDecoded = decodeSkuToConfig(q);

    const filtered = MOCK_CATALOG.filter((p) => {
      const haystack = [
        p.name, p.shortDescription,
        ...p.tags,
        p.defaultConfig.cut, p.defaultConfig.stone,
        ...p.availableStones, ...p.availableMetalColors,
        ...p.availableCuts,
      ].join(' ').toLowerCase();

      if (skuDecoded) {
        return (
          (!skuDecoded.category || p.category === skuDecoded.category) &&
          (!skuDecoded.stone || p.availableStones.includes(skuDecoded.stone!)) &&
          (!skuDecoded.cut || p.availableCuts.includes(skuDecoded.cut!))
        );
      }
      return haystack.includes(q);
    });

    setResults(filtered.slice(0, 6));
  }, [query]);

  useEffect(() => {
    if (!isSearchOpen) setQuery('');
  }, [isSearchOpen]);

  const suggestions = ['Oval cut ring', 'Ceylon Sapphire', 'Bezel eternity', 'Lab diamond pendant', '18K rose gold'];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={searchClose}
          />
          <motion.aside
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 left-0 right-0 z-50 shadow-2xl"
            style={{ backgroundColor: 'var(--color-alabaster)', maxHeight: '80vh', overflowY: 'auto' }}
            role="dialog"
            aria-label="Search"
          >
            {/* Search input */}
            <div
              className="px-6 py-5 flex items-center gap-4 border-b"
              style={{ borderColor: 'var(--color-hairline)' }}
            >
              <Search size={20} style={{ color: 'var(--color-stone)', flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, stone, metal — or paste an exact SKU code..."
                className="flex-1 bg-transparent text-base outline-none search-input"
                style={{
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-espresso)',
                }}
              />
              <button onClick={searchClose} className="p-1 opacity-50 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <div className="max-w-screen-lg mx-auto px-6 py-6">
              {/* Suggestions (when no query) */}
              {!query && (
                <div>
                  <p className="section-label mb-4">POPULAR SEARCHES</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="px-4 py-2 text-sm border transition-colors hover:border-[var(--color-champagne)]"
                        style={{
                          borderColor: 'var(--color-hairline)',
                          color: 'var(--color-espresso)',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {query && results.length > 0 && (
                <div>
                  <p className="section-label mb-4">{results.length} RESULTS FOR "{query.toUpperCase()}"</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        to={`/configure/${product.slug}`}
                        onClick={searchClose}
                        className="flex items-center gap-4 p-4 border transition-all hover:border-[var(--color-champagne)] group"
                        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
                      >
                        <div
                          className="w-12 h-12 flex-shrink-0"
                          style={{ backgroundColor: product.imagePlaceholderColor + '30', border: '1px solid var(--color-hairline)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', fontSize: '1rem', fontWeight: 300 }}>
                            {product.name}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-stone)' }}>
                            {METAL_COLOR_LABELS[product.defaultConfig.metalColor]} · {CUT_LABELS[product.defaultConfig.cut]} · {STONE_LABELS[product.defaultConfig.stone]}
                          </p>
                        </div>
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--color-champagne)' }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {query && results.length === 0 && (
                <div className="py-8 text-center">
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                    No results found
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-stone)' }}>
                    Try a different search term, or browse our{' '}
                    <Link to="/collections/all" onClick={searchClose} style={{ color: 'var(--color-champagne)' }}>
                      full collection
                    </Link>.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
