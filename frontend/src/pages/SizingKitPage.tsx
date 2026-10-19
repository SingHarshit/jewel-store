import { useState } from 'react';

import { Check, ShoppingBag } from 'lucide-react';
import { useJewelryStore } from '../store/useJewelryStore';

const KIT_ITEMS = [
  'Precision-machined aluminium sizer set',
  '17 half-sizes — D through to T (UK sizing)',
  'Size guide booklet with conversion charts',
  'Discreet branded packaging',
  '$19 redeemable as store credit on any ring order',
  'Free standard shipping Australia-wide',
  'International shipping available for $9',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Order Your Kit',
    description: 'Add the Heirest Ring Sizing Kit to your bag for $19. It ships within 1 business day, free within Australia.',
  },
  {
    step: '02',
    title: 'Find Your Perfect Fit',
    description: 'Slide the precision aluminium rings onto each finger you intend to wear jewellery on. Note the half-size that fits comfortably all day.',
  },
  {
    step: '03',
    title: 'Configure Your Ring',
    description: 'Return to the Configurator and enter your exact size. Your $19 is automatically applied as a credit to your ring order.',
  },
  {
    step: '04',
    title: 'Receive Your Heirloom',
    description: 'Your bespoke ring is crafted to your exact specifications and delivered fully insured — guaranteed to fit.',
  },
];

export default function SizingKitPage() {
  const { addToCart } = useJewelryStore();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart('sizing-kit', {
      category: 'RG', style: 'SL', setting: 'BEZ', cut: 'RND',
      caratWeight: 0, metalPurity: '9K', metalColor: 'YG',
      stone: 'WLD', orientation: 'NS', stoneCount: 0, quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <section
        className="py-24 px-4 md:px-8 border-b"
        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-espresso)' }}
      >
        <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="section-label mb-4" style={{ color: 'var(--color-champagne)' }}>
              The Heirest Sizing Kit
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4rem', color: 'var(--color-alabaster)', fontWeight: 300, lineHeight: 1.1 }}>
              Find your<br />
              <em style={{ color: 'var(--color-champagne)' }}>perfect fit.</em><br />
              The first time.
            </h1>
            <p className="mt-6 mb-8 leading-relaxed" style={{ color: 'rgba(243,241,236,0.65)', fontFamily: 'var(--font-sans)' }}>
              A precision aluminium ring sizing set covering 17 half-sizes — all for $19.
              That $19 is completely redeemable as store credit toward any ring you order.
              <strong style={{ color: 'var(--color-champagne)' }}> Essentially free.</strong>
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-8 py-4 text-[0.75rem] tracking-[0.15em] uppercase font-mono transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)' }}
              >
                {added ? <><Check size={14} /> Added to Bag</> : <><ShoppingBag size={14} /> Add to Bag — $19</>}
              </button>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                FREE SHIPPING · REDEEMABLE CREDIT
              </p>
            </div>
          </div>

          {/* Kit visual */}
          <div className="flex items-center justify-center">
            <div
              className="relative w-72 h-72 flex items-center justify-center"
              style={{ border: '1px solid rgba(197,168,128,0.25)', backgroundColor: 'rgba(197,168,128,0.05)' }}
            >
              <svg viewBox="0 0 240 240" className="w-56 h-56">
                <defs>
                  <linearGradient id="kit-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E0E0E8" />
                    <stop offset="100%" stopColor="#A0A0B0" />
                  </linearGradient>
                </defs>
                {/* Stack of sizing rings */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <ellipse
                    key={i}
                    cx={120}
                    cy={130 - i * 12}
                    rx={70 - i * 2}
                    ry={20 - i}
                    fill="url(#kit-metal)"
                    opacity={1 - i * 0.08}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                  />
                ))}
                <text x="120" y="210" textAnchor="middle" fill="rgba(197,168,128,0.6)" fontSize="10" fontFamily="JetBrains Mono" letterSpacing="3">
                  17 SIZES · D–T
                </text>
              </svg>
              <div
                className="absolute bottom-4 right-4 p-2 text-right"
                style={{ backgroundColor: 'rgba(20,20,19,0.8)' }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-champagne)', fontWeight: 300 }}>$19</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                  FULLY REDEEMABLE
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 md:px-8 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
        <div className="max-w-screen-xl mx-auto">
          <p className="section-label mb-3">Process</p>
          <h2 className="mb-12" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="border-t pt-5" style={{ borderColor: 'var(--color-champagne)' }}>
                <p className="section-label mb-2" style={{ color: 'var(--color-champagne)' }}>{step.step}</p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-espresso)', fontWeight: 300, marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 px-4 md:px-8 border-b" style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}>
        <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <p className="section-label mb-3">Included</p>
            <h2 className="mb-8" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              What's in the kit
            </h2>
            <ul className="space-y-3">
              {KIT_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={16} style={{ color: 'var(--color-champagne)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-espresso)', fontSize: '0.95rem' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="p-8 flex flex-col justify-center"
            style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
          >
            <p className="section-label mb-4" style={{ color: 'var(--color-champagne)' }}>The $19 Promise</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-espresso)', fontWeight: 300, lineHeight: 1.3 }}>
              "Every Heirest sizing kit is fully redeemable. The $19 is yours to keep as credit."
            </p>
            <p className="mt-4 text-sm" style={{ color: 'var(--color-stone)' }}>
              Your $19 is automatically stored as a credit against your account. It applies to any ring
              order, with no minimum spend and no expiry date.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="mb-6" style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
          Ready to find your size?
        </h2>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-10 py-4 text-[0.75rem] tracking-[0.15em] uppercase font-mono transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          {added ? <><Check size={14} /> Added!</> : <><ShoppingBag size={14} /> Order Sizing Kit — $19</>}
        </button>
        <p className="mt-3 section-label" style={{ color: 'var(--color-stone)' }}>Free shipping · $19 fully redeemable</p>
      </section>
    </div>
  );
}
