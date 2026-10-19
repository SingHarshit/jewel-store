import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { number: Step; title: string; description: string }[] = [
  { number: 1, title: 'Your Vision', description: 'Tell us about the piece you have in mind — the occasion, the person, any reference images or sketches.' },
  { number: 2, title: 'Stone Selection', description: 'Select your preferred gemstone type, origin, and approximate carat weight. Our gemologist will curate options.' },
  { number: 3, title: 'Metal & Craft', description: 'Choose your preferred metal and purity. We\'ll discuss the setting, finish, and any technical constraints.' },
  { number: 4, title: 'Commission Brief', description: 'We\'ll compile your brief and provide a quotation within 48 hours, including a full scope of work.' },
  { number: 5, title: 'Review & Begin', description: 'Review your commission agreement, approve the scope, and your heirloom creation begins.' },
];

const OCCASIONS = ['Engagement', 'Anniversary', 'Self-purchase', 'Wedding', 'Birthday', 'Heirloom Re-set', 'Other'];
const BUDGETS = ['$2,000–$5,000', '$5,000–$10,000', '$10,000–$20,000', '$20,000–$50,000', '$50,000+'];
const TIMELINES = ['Within 3 months', '3–6 months', '6–12 months', 'Over 12 months', 'No deadline'];

interface BespokeForm {
  name: string;
  email: string;
  phone: string;
  occasion: string;
  vision: string;
  stonePreference: string;
  budgetRange: string;
  timeline: string;
  referenceLink: string;
  engraving: string;
}

export default function BespokePage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<BespokeForm>({
    name: '', email: '', phone: '', occasion: '', vision: '',
    stonePreference: '', budgetRange: '', timeline: '', referenceLink: '', engraving: '',
  });

  const update = (key: keyof BespokeForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const nextStep = () => setCurrentStep((s) => Math.min(5, s + 1) as Step);
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1) as Step);
  const handleSubmit = () => setSubmitted(true);

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <section
        className="py-24 px-4 md:px-8 border-b"
        style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-espresso)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-4" style={{ color: 'var(--color-champagne)' }}>Bespoke Commission</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4rem', color: 'var(--color-alabaster)', fontWeight: 300, lineHeight: 1.1 }}>
            One-of-a-kind.<br />
            <em style={{ color: 'var(--color-champagne)' }}>Authored entirely by you.</em>
          </h1>
          <p className="mt-6 max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(243,241,236,0.65)', fontFamily: 'var(--font-sans)' }}>
            For pieces beyond our configurator — heirloom resets, rare stones, or truly one-of-one commissions.
            Our master jeweller works with you from first sketch to final polishing.
          </p>
        </div>
      </section>

      {/* Multi-step form */}
      <section className="py-20 px-4 md:px-8 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
        <div className="max-w-3xl mx-auto">

          {!submitted ? (
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-12">
                {STEPS.map((step) => (
                  <div key={step.number} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 flex items-center justify-center text-xs font-mono transition-all"
                      style={{
                        backgroundColor: currentStep > step.number ? 'var(--color-espresso)' : currentStep === step.number ? 'var(--color-champagne)' : 'var(--color-ivory)',
                        color: currentStep >= step.number ? (currentStep === step.number ? 'var(--color-espresso)' : 'var(--color-ivory)') : 'var(--color-stone)',
                        border: `1px solid ${currentStep >= step.number ? (currentStep === step.number ? 'var(--color-champagne)' : 'var(--color-espresso)') : 'var(--color-hairline)'}`,
                      }}
                    >
                      {currentStep > step.number ? <Check size={12} /> : step.number}
                    </div>
                    {step.number < 5 && (
                      <div
                        className="h-px w-8 md:w-16"
                        style={{ backgroundColor: currentStep > step.number ? 'var(--color-espresso)' : 'var(--color-hairline)' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step header */}
              <div className="mb-8">
                <p className="section-label mb-2" style={{ color: 'var(--color-champagne)' }}>
                  Step {currentStep} of 5
                </p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                  {STEPS[currentStep - 1].title}
                </h2>
                <p className="mt-2" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}>
                  {STEPS[currentStep - 1].description}
                </p>
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="section-label block mb-2">Your Name</label>
                          <input className="input-underline" placeholder="Alexandra Chen" value={form.name} onChange={e => update('name', e.target.value)} />
                        </div>
                        <div>
                          <label className="section-label block mb-2">Email Address</label>
                          <input className="input-underline" type="email" placeholder="alex@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="section-label block mb-2">Occasion</label>
                        <div className="flex flex-wrap gap-2">
                          {OCCASIONS.map((occ) => (
                            <button
                              key={occ}
                              onClick={() => update('occasion', occ)}
                              className="px-4 py-2 text-sm border transition-all font-sans"
                              style={{
                                borderColor: form.occasion === occ ? 'var(--color-espresso)' : 'var(--color-hairline)',
                                backgroundColor: form.occasion === occ ? 'var(--color-espresso)' : 'transparent',
                                color: form.occasion === occ ? 'var(--color-ivory)' : 'var(--color-stone)',
                              }}
                            >
                              {occ}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="section-label block mb-2">Describe Your Vision</label>
                        <textarea
                          className="input-underline resize-none"
                          rows={4}
                          placeholder="Tell us about the piece — the feeling, the reference, the person it's for..."
                          value={form.vision}
                          onChange={e => update('vision', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <label className="section-label block mb-2">Stone Preference</label>
                        <textarea
                          className="input-underline resize-none"
                          rows={3}
                          placeholder="E.g. natural Ceylon sapphire, oval cut, approximately 2ct, unheated preferred..."
                          value={form.stonePreference}
                          onChange={e => update('stonePreference', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-2">Reference Image / Moodboard Link</label>
                        <input
                          className="input-underline"
                          placeholder="https://pinterest.com/..."
                          value={form.referenceLink}
                          onChange={e => update('referenceLink', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <label className="section-label block mb-3">Budget Range</label>
                        <div className="flex flex-wrap gap-2">
                          {BUDGETS.map((b) => (
                            <button
                              key={b}
                              onClick={() => update('budgetRange', b)}
                              className="px-4 py-2 text-sm font-mono border transition-all"
                              style={{
                                borderColor: form.budgetRange === b ? 'var(--color-espresso)' : 'var(--color-hairline)',
                                backgroundColor: form.budgetRange === b ? 'var(--color-espresso)' : 'transparent',
                                color: form.budgetRange === b ? 'var(--color-ivory)' : 'var(--color-stone)',
                              }}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="section-label block mb-3">Preferred Timeline</label>
                        <div className="flex flex-wrap gap-2">
                          {TIMELINES.map((t) => (
                            <button
                              key={t}
                              onClick={() => update('timeline', t)}
                              className="px-4 py-2 text-sm font-sans border transition-all"
                              style={{
                                borderColor: form.timeline === t ? 'var(--color-espresso)' : 'var(--color-hairline)',
                                backgroundColor: form.timeline === t ? 'var(--color-espresso)' : 'transparent',
                                color: form.timeline === t ? 'var(--color-ivory)' : 'var(--color-stone)',
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div
                        className="p-6"
                        style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
                      >
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-espresso)', fontWeight: 300, marginBottom: 12 }}>
                          Your Commission Brief
                        </h3>
                        {[
                          ['Name', form.name || '—'],
                          ['Email', form.email || '—'],
                          ['Occasion', form.occasion || '—'],
                          ['Vision', form.vision || '—'],
                          ['Stone Preference', form.stonePreference || '—'],
                          ['Budget', form.budgetRange || '—'],
                          ['Timeline', form.timeline || '—'],
                        ].map(([label, value]) => (
                          <div key={label} className="flex gap-4 py-2 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
                            <span className="section-label w-36 flex-shrink-0">{label}</span>
                            <span className="text-sm" style={{ color: 'var(--color-espresso)', fontFamily: 'var(--font-sans)' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="section-label block mb-2">Custom Engraving (optional)</label>
                        <input
                          className="input-underline"
                          placeholder="Special inscription for the piece..."
                          maxLength={40}
                          value={form.engraving}
                          onChange={e => update('engraving', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <div
                        className="p-6 border-l-4"
                        style={{ borderLeftColor: 'var(--color-champagne)', backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
                      >
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                          Ready to begin your commission
                        </p>
                        <p className="text-sm mt-2" style={{ color: 'var(--color-stone)' }}>
                          Submitting this form sends your brief to our master jeweller. We will respond with a
                          personalised quotation within 48 hours, along with initial sketches if appropriate.
                          There is no obligation until you sign the commission agreement.
                        </p>
                      </div>
                      {[
                        'I understand this is a bespoke commission with a minimum 8-week lead time',
                        'I agree that a 30% deposit is required upon signing the commission agreement',
                        'I acknowledge that bespoke pieces are non-returnable once in production',
                      ].map((term) => (
                        <label key={term} className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="mt-1 accent-[#C5A880]" />
                          <span className="text-sm" style={{ color: 'var(--color-espresso)', fontFamily: 'var(--font-sans)' }}>{term}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-3 text-[0.65rem] tracking-widest uppercase font-mono border transition-all disabled:opacity-30"
                  style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}
                >
                  Back
                </button>
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3 text-[0.65rem] tracking-widest uppercase font-mono transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-8 py-3 text-[0.65rem] tracking-widest uppercase font-mono transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)' }}
                  >
                    Submit Commission Brief <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'var(--color-champagne)' }}
              >
                <Check size={28} color="white" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                Commission Submitted
              </h2>
              <p className="mt-4 max-w-md mx-auto" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}>
                Thank you, {form.name || 'valued client'}. Our master jeweller will review your brief and respond
                within 48 hours with a personalised quotation. Check your email at {form.email || 'the address provided'}.
              </p>
              <div className="mt-8">
                <p className="section-label mb-2" style={{ color: 'var(--color-stone)' }}>Your Commission Reference</p>
                <div className="sku-badge inline-block">HRS-BSPK-{Date.now().toString().slice(-6)}</div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
