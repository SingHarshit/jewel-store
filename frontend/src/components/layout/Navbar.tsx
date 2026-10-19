import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { useJewelryStore } from '../../store/useJewelryStore';

// ---------------------------------------------------------------
// Mega-menu data
// ---------------------------------------------------------------
const megaMenuData = [
  {
    label: 'Rings',
    href: '/collections/rings',
    sections: [
      {
        heading: 'BY STYLE',
        links: [
          { label: 'Signature 5-Stone Ring', href: '/configure/signature-5-stone-ring' },
          { label: 'Bezel Eternity Band', href: '/configure/bezel-eternity-ring' },
          { label: 'Georgian Pinky Ring', href: '/configure/georgian-pinky-ring' },
          { label: 'Heritage Signet Ring', href: '/configure/heritage-signet-ring' },
        ],
      },
      {
        heading: 'BY OCCASION',
        links: [
          { label: 'Engagement', href: '/collections/rings?occasion=engagement' },
          { label: 'Wedding Bands', href: '/collections/rings?occasion=wedding' },
          { label: 'Right Hand', href: '/collections/rings?occasion=fashion' },
          { label: 'Anniversary', href: '/collections/rings?occasion=anniversary' },
        ],
      },
    ],
    editorial: { label: 'NEW — Georgian Pinky Ring', href: '/configure/georgian-pinky-ring', tag: 'Just Arrived' },
  },
  {
    label: 'Pendants',
    href: '/collections/pendants',
    sections: [
      {
        heading: 'BY STYLE',
        links: [
          { label: 'Bezel Solitaire Pendant', href: '/configure/bezel-solitaire-pendant' },
          { label: 'Georgian Heart Pendant', href: '/configure/georgian-heart-pendant' },
          { label: 'East–West Emerald Cut', href: '/configure/east-west-emerald-cut-pendant' },
          { label: 'Letter Medallion', href: '/configure/letter-medallion-pendant' },
        ],
      },
      {
        heading: 'BY STONE',
        links: [
          { label: 'Lab Diamond', href: '/collections/pendants?stone=WLD' },
          { label: 'Sapphire', href: '/collections/pendants?stone=SAP' },
          { label: 'Emerald', href: '/collections/pendants?stone=EMR' },
          { label: 'Ruby', href: '/collections/pendants?stone=RBY' },
        ],
      },
    ],
    editorial: { label: 'LOVE — Georgian Heart Pendant', href: '/configure/georgian-heart-pendant', tag: 'New' },
  },
  {
    label: 'Earrings',
    href: '/collections/earrings',
    sections: [
      {
        heading: 'BY STYLE',
        links: [
          { label: 'Brilliant Cut Studs', href: '/configure/brilliant-cut-stud-earrings' },
          { label: 'Oval Drop Earrings', href: '/configure/oval-drop-earrings' },
        ],
      },
    ],
    editorial: { label: 'CLASSICS — Brilliant Studs', href: '/configure/brilliant-cut-stud-earrings', tag: 'Bestseller' },
  },
  {
    label: 'Bracelets',
    href: '/collections/bracelets',
    sections: [
      {
        heading: 'BY STYLE',
        links: [
          { label: 'Classic Tennis Bracelet', href: '/configure/tennis-bracelet' },
          { label: 'Solitaire Bangle', href: '/configure/solitaire-bracelet' },
        ],
      },
    ],
    editorial: { label: 'ICON — Tennis Bracelet', href: '/configure/tennis-bracelet', tag: 'Bestseller' },
  },
  { label: 'Shop Bespoke', href: '/bespoke', sections: [], editorial: null },
  { label: 'Our Standards', href: '/#standards', sections: [], editorial: null },
  { label: 'Sizing Kits', href: '/sizing-kit', sections: [], editorial: null },
];

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { cartOpen, searchOpen, cartCount } = useJewelryStore();
  const count = cartCount();
  const location = useLocation();

  const handleMouseEnter = (label: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpenMenu(label);
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setOpenMenu(null), 150);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor: 'var(--color-alabaster)',
        borderColor: 'var(--color-hairline)',
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex flex-col leading-none" style={{ fontFamily: 'var(--font-serif)' }}>
            <span className="text-2xl font-light tracking-[-0.04em]" style={{ color: 'var(--color-espresso)' }}>
              Heirest
            </span>
            <span className="text-[0.55rem] tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-stone)' }}>
              Fine Jewellery
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {megaMenuData.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.sections.length > 0 ? handleMouseEnter(item.label) : undefined}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={item.href}
                  className="flex items-center gap-0.5 px-3 py-2 text-[0.75rem] tracking-[0.08em] uppercase transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: location.pathname === item.href ? 'var(--color-champagne)' : 'var(--color-espresso)',
                  }}
                >
                  {item.label}
                  {item.sections.length > 0 && <ChevronDown size={10} />}
                </Link>

                {/* Mega-menu dropdown */}
                {openMenu === item.label && item.sections.length > 0 && (
                  <div
                    className="absolute left-0 top-full mt-0 min-w-[580px] p-8 shadow-2xl grid grid-cols-3 gap-8 z-50"
                    style={{
                      backgroundColor: 'var(--color-alabaster)',
                      border: '1px solid var(--color-hairline)',
                    }}
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Sections */}
                    {item.sections.map((section) => (
                      <div key={section.heading}>
                        <p className="section-label mb-4">{section.heading}</p>
                        <ul className="space-y-3">
                          {section.links.map((link) => (
                            <li key={link.label}>
                              <Link
                                to={link.href}
                                onClick={() => setOpenMenu(null)}
                                className="text-sm transition-colors hover:opacity-60"
                                style={{
                                  fontFamily: 'var(--font-serif)',
                                  color: 'var(--color-espresso)',
                                  fontSize: '1rem',
                                  fontWeight: 300,
                                }}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Editorial callout */}
                    {item.editorial && (
                      <div className="col-span-1">
                        <p className="section-label mb-4">FEATURED</p>
                        <Link
                          to={item.editorial.href}
                          onClick={() => setOpenMenu(null)}
                          className="block p-4 border transition-colors hover:border-[var(--color-champagne)]"
                          style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
                        >
                          <span
                            className="text-[0.6rem] tracking-widest uppercase mb-2 block"
                            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-champagne)' }}
                          >
                            {item.editorial.tag}
                          </span>
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--color-espresso)' }}>
                            {item.editorial.label}
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={searchOpen}
              className="p-2 transition-opacity hover:opacity-60"
              aria-label="Search"
            >
              <Search size={18} style={{ color: 'var(--color-espresso)' }} />
            </button>
            <Link to="/account" className="p-2 transition-opacity hover:opacity-60" aria-label="Account">
              <User size={18} style={{ color: 'var(--color-espresso)' }} />
            </Link>
            <button
              onClick={cartOpen}
              className="p-2 transition-opacity hover:opacity-60 relative"
              aria-label={`Cart (${count} items)`}
            >
              <ShoppingBag size={18} style={{ color: 'var(--color-espresso)' }} />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[0.55rem] flex items-center justify-center text-white font-mono"
                  style={{ backgroundColor: 'var(--color-champagne)' }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
