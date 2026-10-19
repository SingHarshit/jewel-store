import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOCK_CATALOG, COMMUNITY_DESIGNS, PRESS_QUOTES } from '../data/mockCatalog';
import { formatPrice } from '../utils/pricingEngine';
import { useJewelryStore } from '../store/useJewelryStore';


// ─── Category data ────────────────────────────────────────────
const CATEGORIES = [
  { id: 'rings',     label: 'Rings',     href: '/collections/rings',     color: '#C5A880' },
  { id: 'pendants',  label: 'Pendants',  href: '/collections/pendants',  color: '#B8A99A' },
  { id: 'earrings',  label: 'Earrings',  href: '/collections/earrings',  color: '#D4C5B0' },
  { id: 'bracelets', label: 'Bracelets', href: '/collections/bracelets', color: '#8C7B6E' },
  { id: 'necklaces', label: 'Necklaces', href: '/collections/all',       color: '#A8C5C0' },
];

// ─── Standards tabs ───────────────────────────────────────────
const STANDARDS = [
  {
    number: '01',
    title: 'Craft',
    subtitle: '3rd-Generation Master Jewellers',
    body: 'Every Heirest piece is handcrafted in our Sydney atelier by third-generation master jewellers with over 60 years of accumulated expertise. We reject mass production categorically. Your piece is touched by human hands at every single stage — from wax model through to final hand polish.',
    details: ['Lost-wax casting', 'Hand-setting by master setters', 'Individual QC by senior craftsmen', 'Traditional hand polishing'],
  },
  {
    number: '02',
    title: 'Quality',
    subtitle: 'D–F Colour · VS2+ Clarity · 8-Stage QC',
    body: 'We source exclusively D, E, and F colour stones at VS2 clarity or above. Every stone is hand-selected by our gemologist from curated lots — never batch purchased. Our lab diamonds are IGI-certified, grown under controlled conditions and optically identical to mined stones.',
    details: ['D–F Colour grading', 'VS2+ Clarity minimum', 'IGI / GIA certified', '8-point quality control sign-off'],
  },
  {
    number: '03',
    title: 'Shipping',
    subtitle: 'Insured Global Delivery via DHL Express',
    body: 'Every Heirest piece ships fully insured at declared value via DHL Express worldwide. Packages are triple-sealed, discreetly marked, and tracked in real-time. We offer complimentary signature-required delivery — because your piece deserves the same security as any vault-worthy object.',
    details: ['Fully insured at declared value', 'DHL Express worldwide', 'Real-time tracking', 'Discreet signature packaging'],
  },
  {
    number: '04',
    title: 'Warranty',
    subtitle: 'Lifetime Warranty & 60-Day Free Resizing',
    body: 'Every Heirest piece carries a lifetime manufacturing warranty against defect. We also offer complimentary resizing within 60 days of delivery, and annual inspection services to maintain your piece\'s condition. Your piece is an heirloom — we treat it accordingly.',
    details: ['Lifetime manufacturing warranty', '60-day complimentary resize', 'Annual inspection available', 'Digital certificate of authenticity'],
  },
];

export default function HomePage() {
  const [activeStandard, setActiveStandard] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { currency } = useJewelryStore();
  const navigate = useNavigate();

  const bestsellers = MOCK_CATALOG.filter((p) => p.isBestseller).slice(0, 4);

  return (
    <div className="animate-fade-up">

      {/* ────────────────────────────────────────────────── */}
      {/* HERO                                              */}
      {/* ────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{ backgroundColor: 'var(--color-espresso)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 80% 40%, #C5A880 0%, transparent 65%)',
          }}
        />

        <div className="max-w-screen-xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-12 items-center w-full py-24">
          {/* Left — copy */}
          <div>
            <p className="section-label mb-6" style={{ color: 'var(--color-champagne)' }}>
              Fine Jewellery, Authored By You
            </p>
            <h1
              className="text-6xl md:text-8xl leading-[0.95] mb-8"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-alabaster)', fontWeight: 300, letterSpacing: '-0.03em' }}
            >
              Author what<br />
              <em style={{ color: 'var(--color-champagne)' }}>others</em><br />
              inherit.
            </h1>
            <p
              className="text-lg mb-10 max-w-md leading-relaxed"
              style={{ color: 'rgba(243,241,236,0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
            >
              Every decision yours. Every step visible. Fine jewellery configured to your
              exact specifications — crafted by third-generation master jewellers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/configure/signature-5-stone-ring"
                className="px-8 py-4 text-[0.75rem] tracking-[0.15em] uppercase font-mono transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)' }}
              >
                Design Yours
              </Link>
              <Link
                to="/collections/all"
                className="px-8 py-4 text-[0.75rem] tracking-[0.15em] uppercase font-mono transition-all border border-current flex items-center gap-2"
                style={{ color: 'var(--color-ivory)', borderColor: 'rgba(255,255,255,0.25)' }}
              >
                Explore Collection <ArrowRight size={14} />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mt-14">
              {[['3+', 'Generations of craft'], ['D–F', 'Colour grading'], ['8', 'Stage QC process']].map(([val, label]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-champagne)', fontSize: '2rem', fontWeight: 300 }}>{val}</p>
                  <p className="text-[0.62rem] tracking-[0.1em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero visual */}
          <div className="relative flex items-center justify-center">
            <div
              className="relative w-80 h-80 flex items-center justify-center"
              style={{
                border: '1px solid rgba(197,168,128,0.25)',
                backgroundColor: 'rgba(197,168,128,0.05)',
              }}
            >
              {/* Decorative corner marks */}
              {[['top-0 left-0', '-top-px -left-px'], ['top-0 right-0', '-top-px -right-px'], ['bottom-0 left-0', '-bottom-px -left-px'], ['bottom-0 right-0', '-bottom-px -right-px']].map(([pos], i) => (
                <div key={i} className={`absolute ${pos} w-4 h-4`} style={{ borderColor: 'var(--color-champagne)', borderWidth: '1px', borderStyle: 'solid' }} />
              ))}

              {/* Ring SVG */}
              <svg viewBox="0 0 240 240" className="w-64 h-64">
                <defs>
                  <radialGradient id="hero-metal" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#F0D870" />
                    <stop offset="60%" stopColor="#C5A848" />
                    <stop offset="100%" stopColor="#9A7A28" />
                  </radialGradient>
                  <radialGradient id="hero-stone">
                    <stop offset="0%" stopColor="#F8F8FF" />
                    <stop offset="100%" stopColor="rgba(200,220,255,0.7)" />
                  </radialGradient>
                  <filter id="hero-shadow">
                    <feDropShadow dx="0" dy="12" stdDeviation="20" floodColor="rgba(197,168,128,0.3)" />
                  </filter>
                </defs>

                <g filter="url(#hero-shadow)">
                  {/* Outer band */}
                  <ellipse cx="120" cy="120" rx="90" ry="32" fill="url(#hero-metal)" />
                  {/* Inner cutout */}
                  <ellipse cx="120" cy="120" rx="65" ry="16" fill="#0F0E0D" />
                  {/* Top highlight */}
                  <ellipse cx="120" cy="90" rx="55" ry="8" fill="rgba(255,255,255,0.15)" />
                </g>

                {/* 5 Stones */}
                {[-2, -1, 0, 1, 2].map((offset, i) => {
                  const angle = offset * 0.38;
                  const sx = 120 + 72 * Math.sin(angle);
                  const sy = 120 - 28 * Math.cos(angle) - 2;
                  const size = i === 2 ? 12 : 9;
                  return (
                    <g key={i}>
                      <circle cx={sx} cy={sy} r={size + 2} fill="url(#hero-metal)" />
                      <circle cx={sx} cy={sy} r={size} fill="url(#hero-stone)" />
                      <circle cx={sx - size * 0.25} cy={sy - size * 0.25} r={size * 0.3} fill="rgba(255,255,255,0.5)" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating tag */}
            <div
              className="absolute bottom-8 right-0 p-3 text-right"
              style={{ backgroundColor: 'var(--color-espresso)', border: '1px solid rgba(197,168,128,0.3)' }}
            >
              <p className="font-mono text-[0.6rem] tracking-widest uppercase" style={{ color: 'var(--color-champagne)' }}>Configured Live</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                RG-5S-CLW-OV-10018YG-WLD
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12" style={{ backgroundColor: 'var(--color-champagne)' }} />
          <p className="section-label" style={{ color: 'var(--color-ivory)' }}>scroll</p>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* CATEGORY SCROLLER                                 */}
      {/* ────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 md:px-8 border-b"
        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-alabaster)' }}
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              By Category
            </h2>
            <Link to="/collections/all" className="flex items-center gap-2 section-label hover:opacity-60 transition-opacity" style={{ color: 'var(--color-stone)' }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={cat.href}
                className="group relative overflow-hidden aspect-[3/4] flex flex-col justify-end p-5 transition-all"
                style={{ backgroundColor: cat.color + '20', border: '1px solid var(--color-hairline)' }}
              >
                {/* Category visual */}
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{ background: `radial-gradient(ellipse at 50% 40%, ${cat.color} 0%, transparent 70%)` }}
                />
                <div className="relative z-10">
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                    {cat.label}
                  </p>
                  <div className="flex items-center gap-1 mt-1 section-label opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-champagne)' }}>
                    Configure <ChevronRight size={10} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* BESTSELLERS                                        */}
      {/* ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8" style={{ backgroundColor: 'var(--color-ivory)' }}>
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Most Authored</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                Community Favourites
              </h2>
            </div>
            <Link to="/collections/all" className="section-label hover:opacity-60 transition-opacity flex items-center gap-2" style={{ color: 'var(--color-stone)' }}>
              Full Collection <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestsellers.map((product) => (
              <Link
                key={product.id}
                to={`/configure/${product.slug}`}
                className="group block border transition-all hover:border-[var(--color-champagne)]"
                style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-alabaster)' }}
              >
                <div
                  className="aspect-square flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: product.imagePlaceholderColor + '18' }}
                >
                  <div
                    className="w-24 h-24 rounded-full transition-transform group-hover:scale-110"
                    style={{ backgroundColor: product.imagePlaceholderColor + '60' }}
                  />
                </div>
                <div className="p-4">
                  {product.isBestseller && (
                    <p className="section-label mb-1" style={{ color: 'var(--color-champagne)' }}>Bestseller</p>
                  )}
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                    {product.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-stone)' }}>{product.shortDescription}</p>
                  <p className="mt-3" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-espresso)' }}>
                    From {formatPrice(product.baseCraftsmanshipFee, currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* AUTHORED BY YOU — Community Carousel              */}
      {/* ────────────────────────────────────────────────── */}
      <section
        className="py-20 border-t border-b"
        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-alabaster)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2" style={{ color: 'var(--color-champagne)' }}>Authored By You</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                The Community's Designs
              </h2>
            </div>
          </div>
        </div>

        {/* Horizontal scroll carousel */}
        <div
          ref={carouselRef}
          className="overflow-x-auto pb-4 px-4 md:px-8"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-4 w-max max-w-none">
            {COMMUNITY_DESIGNS.map((design) => (
              <div
                key={design.id}
                className="w-72 flex-shrink-0 border group"
                style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
              >
                {/* Visual */}
                <div
                  className="h-48 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: design.accentColor + '18' }}
                >
                  <div
                    className="w-20 h-20 rounded-full"
                    style={{ backgroundColor: design.accentColor + '50' }}
                  />
                  {/* Timestamp overlay */}
                  <div className="absolute top-3 right-3">
                    <span className="font-mono text-[0.6rem] tracking-widest" style={{ color: 'var(--color-stone)' }}>
                      {design.timestamp}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="section-label mb-1" style={{ color: 'var(--color-champagne)' }}>
                    {design.authorHandle}
                  </p>
                  <div className="sku-badge mb-2">{design.sku}</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-stone)' }}>
                    {design.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
                      <Heart size={12} />
                      <span>{design.likes.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/configure/${MOCK_CATALOG.find(p => p.id === design.productId)?.slug}?sku=${design.sku}`)}
                      className="text-[0.65rem] tracking-widest uppercase font-mono px-3 py-1.5 transition-all border hover:bg-[var(--color-espresso)] hover:text-[var(--color-ivory)] hover:border-[var(--color-espresso)]"
                      style={{ borderColor: 'var(--color-champagne)', color: 'var(--color-champagne)' }}
                    >
                      Configure This
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* OUR STANDARDS — 4-Tab Matrix                      */}
      {/* ────────────────────────────────────────────────── */}
      <section
        id="standards"
        className="py-20 px-4 md:px-8 border-b"
        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-espresso)' }}
      >
        <div className="max-w-screen-xl mx-auto">
          <p className="section-label mb-3" style={{ color: 'var(--color-champagne)' }}>Our Standards</p>
          <h2 className="mb-12" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-alabaster)', fontWeight: 300 }}>
            Four Commitments. No Compromise.
          </h2>

          {/* Tab headers */}
          <div
            className="flex border-b mb-0"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {STANDARDS.map((s, i) => (
              <button
                key={s.number}
                onClick={() => setActiveStandard(i)}
                className="flex-1 pb-4 text-left transition-all"
                style={{
                  borderBottom: `2px solid ${activeStandard === i ? 'var(--color-champagne)' : 'transparent'}`,
                  marginBottom: '-1px',
                }}
              >
                <p className="section-label mb-1" style={{ color: activeStandard === i ? 'var(--color-champagne)' : 'rgba(255,255,255,0.4)' }}>
                  {s.number}
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: activeStandard === i ? 'var(--color-alabaster)' : 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
                  {s.title}
                </p>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
            key={activeStandard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-10 grid md:grid-cols-2 gap-12"
          >
            <div>
              <h3 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-alabaster)', fontWeight: 300 }}>
                {STANDARDS[activeStandard].subtitle}
              </h3>
              <p className="leading-relaxed" style={{ color: 'rgba(243,241,236,0.65)', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                {STANDARDS[activeStandard].body}
              </p>
            </div>
            <div>
              <p className="section-label mb-4" style={{ color: 'var(--color-champagne)' }}>Our Commitments</p>
              <ul className="space-y-3">
                {STANDARDS[activeStandard].details.map((detail) => (
                  <li key={detail} className="flex items-start gap-3">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-champagne)' }} />
                    <span style={{ color: 'rgba(243,241,236,0.8)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>{detail}</span>
                  </li>
                ))}
              </ul>
              {activeStandard === 0 && (
                <Link
                  to="/bespoke"
                  className="inline-flex items-center gap-2 mt-8 text-[0.7rem] tracking-widest uppercase font-mono transition-colors"
                  style={{ color: 'var(--color-champagne)' }}
                >
                  Commission a Bespoke Piece <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* PRESS TICKER                                       */}
      {/* ────────────────────────────────────────────────── */}
      <section
        className="py-14 overflow-hidden border-b"
        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
      >
        <p className="section-label text-center mb-8">As Seen In</p>
        <div className="overflow-hidden">
          <div className="ticker-track">
            {[...PRESS_QUOTES, ...PRESS_QUOTES].map((quote, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-10 py-2 flex items-center gap-8"
              >
                <span
                  className="text-[0.65rem] tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-champagne)', whiteSpace: 'nowrap' }}
                >
                  {quote.publication}
                </span>
                <span
                  className="max-w-xs text-sm italic"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-stone)', whiteSpace: 'nowrap' }}
                >
                  "{quote.quote.slice(0, 60)}..."
                </span>
                <span style={{ color: 'var(--color-hairline)' }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* CTA BAND                                          */}
      {/* ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center" style={{ backgroundColor: 'var(--color-alabaster)' }}>
        <p className="section-label mb-4">Begin Your Commission</p>
        <h2 className="mb-6" style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
          What will you author?
        </h2>
        <p className="max-w-md mx-auto mb-10 leading-relaxed" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}>
          Configure your piece online. Approve the 3D CAD render. Receive your heirloom.
        </p>
        <Link
          to="/configure/signature-5-stone-ring"
          className="inline-flex px-10 py-4 text-[0.75rem] tracking-[0.15em] uppercase font-mono transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          Start Configuring
        </Link>
      </section>
    </div>
  );
}
