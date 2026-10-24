import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';
import { useJewelryStore } from '../../store/useJewelryStore';
import { CURRENCY_RATES } from '../../utils/pricingEngine';
import type { Currency } from '../../types/jewelry';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const { currency, setCurrency, cmsSettings } = useJewelryStore();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // Driven by admin CMS settings
  if (!visible || !cmsSettings.announcementBarVisible) return null;

  const currentRate = CURRENCY_RATES.find((r) => r.code === currency)!;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-espresso)',
        color: 'var(--color-ivory)',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
      }}
      className="relative z-50"
    >
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-9">
        {/* Left links */}
        <div className="hidden md:flex items-center gap-6 text-[0.65rem] tracking-widest uppercase opacity-70">
          <Link to="/account?tab=orders" className="hover:opacity-100 transition-opacity">Orders</Link>
          <Link to="/account?tab=vault" className="hover:opacity-100 transition-opacity">My Vault</Link>
          <Link to="/account?tab=designs" className="hover:opacity-100 transition-opacity">My Designs</Link>
        </div>

        {/* Centre announcement — driven by admin CMS */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center text-[0.65rem] tracking-[0.15em] uppercase">
          <Link to="/sizing-kit" className="hover:opacity-80 transition-opacity">
            {cmsSettings.announcementBarText.split('+').length > 1 ? (
              <>
                {cmsSettings.announcementBarText.split('+')[0].trim()}&nbsp;
                <span style={{ color: 'var(--color-champagne)' }}>
                  + {cmsSettings.announcementBarText.split('+').slice(1).join('+').trim()}
                </span>
              </>
            ) : (
              <span>{cmsSettings.announcementBarText}</span>
            )}
          </Link>
        </div>

        {/* Right: currency switcher + close */}
        <div className="flex items-center gap-4">
          {/* Currency switcher */}
          <div className="relative">
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="flex items-center gap-1 text-[0.65rem] tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity"
            >
              {currentRate.symbol} {currentRate.code}
              <ChevronDown size={10} />
            </button>
            {currencyOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-40 py-1 z-50 shadow-xl"
                style={{ backgroundColor: 'var(--color-espresso)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {CURRENCY_RATES.map((rate) => (
                  <button
                    key={rate.code}
                    onClick={() => {
                      setCurrency(rate.code as Currency);
                      setCurrencyOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[0.65rem] tracking-widest uppercase hover:opacity-100 opacity-60 transition-opacity"
                    style={{ color: currency === rate.code ? 'var(--color-champagne)' : 'var(--color-ivory)' }}
                  >
                    {rate.symbol} {rate.code} — {rate.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setVisible(false)}
            className="opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss announcement"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
