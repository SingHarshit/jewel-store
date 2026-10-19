import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Shield, Truck, Award, ArrowRight } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────
const STANDARDS = [
  {
    id: 'craft',
    number: '01',
    icon: Award,
    title: 'Craft',
    subtitle: '3rd-Generation Master Jewellers',
    body: [
      'Every Heirest piece is handcrafted in our Sydney atelier by third-generation master jewellers with over 60 years of accumulated expertise. We reject mass production categorically.',
      'Your piece is touched by human hands at every single stage — from wax model through to final hand polish. No shortcuts. No compromises.',
    ],
    details: [
      { label: 'Lost-wax casting', desc: 'Traditional process preserving every micro-detail of your design.' },
      { label: 'Hand-setting', desc: 'Each stone placed individually by a master setter under 10× magnification.' },
      { label: 'Individual QC', desc: 'Senior craftsman sign-off at each manufacturing stage.' },
      { label: 'Hand polishing', desc: 'Mirror finish achieved through progressive abrasive hand techniques.' },
    ],
    accentColor: '#C5A880',
  },
  {
    id: 'quality',
    number: '02',
    icon: CheckCircle,
    title: 'Quality',
    subtitle: 'D\u2013F Colour \u00b7 VS2+ Clarity \u00b7 8-Stage QC',
    body: [
      'We source exclusively D, E, and F colour stones at VS2 clarity or above. Every stone is hand-selected by our gemologist from curated lots \u2014 never batch purchased.',
      'Our lab diamonds are IGI-certified, grown under controlled conditions and optically, chemically, and physically identical to mined stones \u2014 at a fraction of the environmental cost.',
    ],
    details: [
      { label: 'D\u2013F Colour grading', desc: 'The top 3 grades in the GIA colour scale \u2014 near-colourless to exceptional.' },
      { label: 'VS2+ Clarity minimum', desc: 'Inclusions invisible to the naked eye at all configurations.' },
      { label: 'IGI / GIA certified', desc: 'Each stone ships with a full laboratory grading report.' },
      { label: '8-point QC sign-off', desc: 'Stone security, integrity, finish, weight, dimensions, engraving, hallmark, documentation.' },
    ],
    accentColor: '#7BA89B',
  },
  {
    id: 'shipping',
    number: '03',
    icon: Truck,
    title: 'Shipping',
    subtitle: 'Insured Global Delivery via DHL Express',
    body: [
      'Every Heirest piece ships fully insured at declared value via DHL Express worldwide. Packages are triple-sealed, discreetly marked, and tracked in real-time.',
      'We offer complimentary signature-required delivery \u2014 because your piece deserves the same security as any vault-worthy object.',
    ],
    details: [
      { label: 'Fully insured at declared value', desc: 'Complete replacement value coverage door-to-door.' },
      { label: 'DHL Express worldwide', desc: 'Delivered to 220+ countries within 2\u20135 business days of dispatch.' },
      { label: 'Real-time tracking', desc: 'Live shipment updates straight to your inbox and account dashboard.' },
      { label: 'Discreet packaging', desc: 'No external branding. Inner presentation box included.' },
    ],
    accentColor: '#A8B8C5',
  },
  {
    id: 'warranty',
    number: '04',
    icon: Shield,
    title: 'Warranty',
    subtitle: 'Lifetime Warranty & 60-Day Free Resizing',
    body: [
      'Every Heirest piece carries a lifetime manufacturing warranty against defect. We also offer complimentary resizing within 60 days of delivery, and annual inspection services to maintain your piece\'s condition.',
      'Your piece is an heirloom \u2014 we treat it accordingly.',
    ],
    details: [
      { label: 'Lifetime manufacturing warranty', desc: 'We stand behind every piece indefinitely against manufacturing defect.' },
      { label: '60-day complimentary resize', desc: 'One free resize within 60 days of receiving your piece.' },
      { label: 'Annual inspection', desc: 'Complimentary annual check-up service to maintain structural integrity.' },
      { label: 'Digital certificate', desc: 'Secure digital certificate of authenticity stored in your Vault.' },
    ],
    accentColor: '#C5A880',
  },
];

const QC_POINTS = [
  { n: '01', title: 'Stone Security', desc: 'Each prong, bezel, and collet checked for secure stone retention.' },
  { n: '02', title: 'Metal Integrity', desc: 'Casting porosity check, solder joint inspection, alloy hardness.' },
  { n: '03', title: 'Surface Finish', desc: 'Mirror polish uniformity; no scratches, tool marks, or pits.' },
  { n: '04', title: 'Declared Weight', desc: 'Metal weight verified against commissioned specification \u00b10.05g.' },
  { n: '05', title: 'Exact Dimensions', desc: 'Ring size, band width, pendant dimensions against CAD file.' },
  { n: '06', title: 'Engraving', desc: 'Text legibility, depth, and font accuracy for all engravings.' },
  { n: '07', title: 'Hallmarking', desc: 'Metal purity hallmark verified against alloy specification.' },
  { n: '08', title: 'Documentation', desc: 'Certificate, grading report, and warranty card all present and correct.' },
];

export default function StandardsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const active = STANDARDS[activeTab];

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <section
        className="relative py-28 overflow-hidden"
        style={{ backgroundColor: 'var(--color-espresso)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at 60% 40%, #C5A880 0%, transparent 70%)' }}
        />
        <div className="relative max-w-screen-xl mx-auto px-8 md:px-16 text-center">
          <p className="section-label mb-6" style={{ color: 'var(--color-champagne)' }}>
            HEIREST STANDARDS \u2014 ESTABLISHED 2019
          </p>
          <h1
            className="font-serif text-5xl md:text-7xl mb-8 leading-tight"
            style={{ color: 'var(--color-alabaster)' }}
          >
            No compromises.
            <br />
            <em>Ever.</em>
          </h1>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-champagne-light)' }}>
            Four pillars guide every decision we make \u2014 from the gemologists we hire to the couriers we trust with your finished piece.
          </p>
        </div>
      </section>

      {/* Four Standards Tabs */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-alabaster)' }}>
        <div className="max-w-screen-xl mx-auto px-8 md:px-16">
          <div
            className="flex gap-0 border-b mb-16 overflow-x-auto"
            style={{ borderColor: 'var(--color-hairline)' }}
          >
            {STANDARDS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveTab(i)}
                className="flex-1 min-w-[140px] py-5 px-4 text-left transition-luxury relative"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: activeTab === i ? 600 : 400,
                  color: activeTab === i ? 'var(--color-espresso)' : 'var(--color-stone)',
                  letterSpacing: '0.05em',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="block mb-1 font-mono text-xs"
                  style={{ color: activeTab === i ? s.accentColor : 'var(--color-stone)', opacity: 0.8 }}
                >
                  {s.number}
                </span>
                {s.title.toUpperCase()}
                {activeTab === i && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: s.accentColor }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="grid md:grid-cols-2 gap-16 items-start"
            >
              <div>
                <div
                  className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full"
                  style={{ backgroundColor: `${active.accentColor}20`, border: `1px solid ${active.accentColor}40` }}
                >
                  <active.icon size={16} style={{ color: active.accentColor }} />
                  <span className="font-mono text-xs tracking-widest uppercase" style={{ color: active.accentColor }}>
                    Standard {active.number}
                  </span>
                </div>

                <h2 className="font-serif text-4xl md:text-5xl mb-4" style={{ color: 'var(--color-espresso)' }}>
                  {active.title}
                </h2>
                <p className="text-sm tracking-wide mb-8" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
                  {active.subtitle}
                </p>

                {active.body.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed mb-4" style={{ color: 'var(--color-stone)' }}>
                    {para}
                  </p>
                ))}
              </div>

              <div className="space-y-4">
                {active.details.map((d, i) => (
                  <motion.div
                    key={d.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 p-5 border"
                    style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
                  >
                    <div
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: `${active.accentColor}25` }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active.accentColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-espresso)' }}>{d.label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-stone)' }}>{d.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 8-Point QC Grid */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-ivory)' }}>
        <div className="max-w-screen-xl mx-auto px-8 md:px-16">
          <div className="text-center mb-16">
            <p className="section-label mb-4">THE HEIREST 8-POINT QC</p>
            <h2 className="font-serif text-4xl md:text-5xl" style={{ color: 'var(--color-espresso)' }}>
              Every piece, inspected in full.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {QC_POINTS.map((qc, i) => (
              <motion.div
                key={qc.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="p-6 border"
                style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-alabaster)' }}
              >
                <p className="font-mono text-xs mb-3" style={{ color: 'var(--color-champagne)', letterSpacing: '0.12em' }}>
                  {qc.n}
                </p>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-espresso)' }}>{qc.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-stone)' }}>{qc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center" style={{ backgroundColor: 'var(--color-espresso)' }}>
        <div className="max-w-screen-xl mx-auto px-8 md:px-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-6" style={{ color: 'var(--color-alabaster)' }}>
            Ready to author your piece?
          </h2>
          <p className="mb-10 text-base" style={{ color: 'var(--color-champagne-light)' }}>
            Every standard above is applied to every piece \u2014 regardless of price point.
          </p>
          <Link
            to="/collections/rings"
            className="inline-flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase transition-luxury"
            style={{
              backgroundColor: 'var(--color-champagne)',
              color: 'var(--color-espresso)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            Browse the Collection
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
