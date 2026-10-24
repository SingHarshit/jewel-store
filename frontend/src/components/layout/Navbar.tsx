import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, ShoppingBag, ChevronDown, User, LogOut,
  BookOpen, Archive, Package, Ruler, Sparkles, Shield,
} from 'lucide-react';
import { useJewelryStore } from '../../store/useJewelryStore';
import type { MembershipTier } from '../../types/jewelry';

// ── Tier pill colours ─────────────────────────────────────────
const TIER_COLORS: Record<MembershipTier, { bg: string; text: string }> = {
  'Private Client':  { bg: 'rgba(197,168,128,0.12)', text: '#C5A880' },
  'Collector':       { bg: 'rgba(197,168,128,0.22)', text: '#A8895E' },
  'Founding Author': { bg: 'rgba(20,20,19,0.08)',    text: '#141413' },
};

// ── Mega-menu data ────────────────────────────────────────────
const megaMenuData = [
  {
    label: 'Rings',
    href: '/collections/rings',
    sections: [
      {
        heading: 'BY STYLE',
        links: [
          { label: 'Signature 5-Stone Ring',  href: '/configure/signature-5-stone-ring' },
          { label: 'Bezel Eternity Band',     href: '/configure/bezel-eternity-ring' },
          { label: 'Georgian Pinky Ring',     href: '/configure/georgian-pinky-ring' },
          { label: 'Heritage Signet Ring',    href: '/configure/heritage-signet-ring' },
        ],
      },
      {
        heading: 'BY OCCASION',
        links: [
          { label: 'Engagement',  href: '/collections/rings?occasion=engagement' },
          { label: 'Wedding Bands', href: '/collections/rings?occasion=wedding' },
          { label: 'Right Hand',  href: '/collections/rings?occasion=fashion' },
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
          { label: 'Bezel Solitaire Pendant',   href: '/configure/bezel-solitaire-pendant' },
          { label: 'Georgian Heart Pendant',    href: '/configure/georgian-heart-pendant' },
          { label: 'East–West Emerald Cut',     href: '/configure/east-west-emerald-cut-pendant' },
          { label: 'Letter Medallion',          href: '/configure/letter-medallion-pendant' },
        ],
      },
      {
        heading: 'BY STONE',
        links: [
          { label: 'Lab Diamond', href: '/collections/pendants?stone=WLD' },
          { label: 'Sapphire',    href: '/collections/pendants?stone=SAP' },
          { label: 'Emerald',     href: '/collections/pendants?stone=EMR' },
          { label: 'Ruby',        href: '/collections/pendants?stone=RBY' },
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
          { label: 'Oval Drop Earrings',  href: '/configure/oval-drop-earrings' },
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
          { label: 'Solitaire Bangle',        href: '/configure/solitaire-bracelet' },
        ],
      },
    ],
    editorial: { label: 'ICON — Tennis Bracelet', href: '/configure/tennis-bracelet', tag: 'Bestseller' },
  },
  { label: 'Shop Bespoke',  href: '/bespoke',      sections: [], editorial: null },
  { label: 'Our Standards', href: '/#standards',   sections: [], editorial: null },
  { label: 'Sizing Kits',   href: '/sizing-kit',   sections: [], editorial: null },
];

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unauthorizedFlash, setUnauthorizedFlash] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const {
    cartOpen, searchOpen, cartCount,
    authUser, isAuthenticated, openAuthModal, signOut,
    savedDesigns, vaultItems,
  } = useJewelryStore();
  const count = cartCount();
  const location = useLocation();
  const isAdmin = authUser?.role === 'admin';

  // Detect unauthorized redirect
  useEffect(() => {
    if (location.search.includes('unauthorized=1')) {
      setUnauthorizedFlash(true);
      const t = setTimeout(() => setUnauthorizedFlash(false), 4000);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpenMenu(label);
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setOpenMenu(null), 150);
  };

  const tierColors = authUser ? TIER_COLORS[authUser.membershipTier] : null;

  return (
    <>
      {/* Unauthorized access flash */}
      {unauthorizedFlash && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 text-[0.65rem] tracking-widest uppercase font-mono shadow-2xl"
          style={{ backgroundColor: '#CC2244', color: '#fff', borderRadius: 2 }}
        >
          ⚠ Unauthorized Access — Admin privileges required
        </div>
      )}
    <header
      className="sticky top-0 z-40 border-b"
      style={{ backgroundColor: 'var(--color-alabaster)', borderColor: 'var(--color-hairline)' }}
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
                    style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
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
                                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', fontSize: '1rem', fontWeight: 300 }}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {item.editorial && (
                      <div className="col-span-1">
                        <p className="section-label mb-4">FEATURED</p>
                        <Link
                          to={item.editorial.href}
                          onClick={() => setOpenMenu(null)}
                          className="block p-4 border transition-colors hover:border-[var(--color-champagne)]"
                          style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
                        >
                          <span className="text-[0.6rem] tracking-widest uppercase mb-2 block" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-champagne)' }}>
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
          <div className="flex items-center gap-1">
            {/* Admin Console Badge */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 mr-2 px-3 py-1.5 text-[0.58rem] tracking-[0.15em] uppercase font-mono transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)' }}
              >
                <Shield size={10} />
                Admin Console
              </Link>
            )}

            <button onClick={searchOpen} className="p-2 transition-opacity hover:opacity-60" aria-label="Search">
              <Search size={18} style={{ color: 'var(--color-espresso)' }} />
            </button>

            {/* ── Auth Area ─────────────────────────────── */}
            {isAuthenticated && authUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="navbar-user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 border transition-all hover:border-[var(--color-espresso)]"
                  style={{ borderColor: 'var(--color-hairline)' }}
                >
                  {/* Avatar initials */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-mono flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-champagne)' }}
                  >
                    {authUser.firstName[0]}{authUser.lastName[0]}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[0.62rem] tracking-wide font-mono" style={{ color: 'var(--color-espresso)' }}>
                      {authUser.authorHandle}
                    </p>
                    {tierColors && (
                      <span
                        className="text-[0.52rem] tracking-widest uppercase font-mono px-1.5 py-0.5 rounded-sm"
                        style={{ backgroundColor: tierColors.bg, color: tierColors.text }}
                      >
                        {authUser.membershipTier}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={10} style={{ color: 'var(--color-stone)' }} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-56 py-2 z-50 shadow-xl"
                    style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
                      <p className="text-xs font-mono" style={{ color: 'var(--color-espresso)' }}>
                        {authUser.firstName} {authUser.lastName}
                      </p>
                      <p className="text-[0.6rem] font-mono mt-0.5" style={{ color: 'var(--color-stone)' }}>
                        {authUser.email}
                      </p>
                    </div>

                    {[
                      ...(isAdmin ? [{ icon: <Shield size={13} />, label: 'Admin Console', to: '/admin' }] : []),
                      { icon: <Archive size={13} />, label: `My Vault (${vaultItems.length})`, to: '/account?tab=vault' },
                      { icon: <BookOpen size={13} />, label: `My Designs (${savedDesigns.length})`, to: '/account?tab=designs' },
                      { icon: <Package size={13} />, label: 'Orders & Live QC', to: '/account?tab=orders' },
                      { icon: <Ruler size={13} />, label: 'Ring Size Profile', to: '/account?tab=profile' },
                    ].map(({ icon, label, to }) => (
                      <Link
                        key={label}
                        to={to}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[0.65rem] tracking-wide font-mono transition-colors hover:bg-[var(--color-ivory)]"
                        style={{
                          color: label === 'Admin Console' ? 'var(--color-champagne)' : 'var(--color-espresso)',
                          fontWeight: label === 'Admin Console' ? 500 : undefined,
                        }}
                      >
                        <span style={{ color: label === 'Admin Console' ? 'var(--color-champagne)' : 'var(--color-stone)' }}>{icon}</span>
                        {label}
                      </Link>
                    ))}

                    <div className="border-t mt-1" style={{ borderColor: 'var(--color-hairline)' }}>
                      <button
                        id="navbar-signout-btn"
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[0.65rem] tracking-wide font-mono transition-colors hover:bg-[var(--color-ivory)]"
                        style={{ color: 'var(--color-stone)' }}
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out state */
              <button
                id="navbar-signin-btn"
                onClick={() => openAuthModal('login')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border text-[0.62rem] tracking-widest uppercase font-mono transition-all hover:border-[var(--color-espresso)] hover:bg-[var(--color-ivory)]"
                style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-espresso)' }}
              >
                <User size={12} />
                Sign In
              </button>
            )}

            {/* Mobile user icon (logged out) */}
            {!isAuthenticated && (
              <button
                className="md:hidden p-2 transition-opacity hover:opacity-60"
                onClick={() => openAuthModal('login')}
                aria-label="Sign in"
              >
                <User size={18} style={{ color: 'var(--color-espresso)' }} />
              </button>
            )}

            {/* Cart */}
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

      {/* Logged-in quick-action bar (thin strip below nav) */}
      {isAuthenticated && authUser && (
        <div
          className="border-t px-4 md:px-8 py-1.5 flex items-center gap-6"
          style={{ borderColor: 'var(--color-hairline)', backgroundColor: isAdmin ? 'rgba(197,168,128,0.08)' : 'var(--color-ivory)' }}
        >
          {isAdmin ? (
            <>
              <span className="text-[0.58rem] tracking-widest uppercase font-mono flex items-center gap-1.5" style={{ color: 'var(--color-champagne)' }}>
                <Shield size={9} style={{ color: 'var(--color-champagne)' }} />
                Store Admin — Master Jeweller Access
              </span>
              <div className="h-3 w-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
              <Link to="/admin" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-champagne)' }}>
                Dashboard
              </Link>
              <Link to="/admin?tab=catalog" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                Catalog
              </Link>
              <Link to="/admin?tab=pricing" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                Pricing
              </Link>
              <Link to="/admin?tab=orders" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                Orders
              </Link>
            </>
          ) : (
            <>
              <span className="text-[0.58rem] tracking-widest uppercase font-mono flex items-center gap-1.5" style={{ color: 'var(--color-stone)' }}>
                <Sparkles size={9} style={{ color: 'var(--color-champagne)' }} />
                {authUser.membershipTier}
              </span>
              <div className="h-3 w-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
              <Link to="/account?tab=vault" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                My Vault
              </Link>
              <Link to="/account?tab=designs" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                My Designs
              </Link>
              <Link to="/account?tab=orders" className="text-[0.58rem] tracking-widest uppercase font-mono hover:opacity-70 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                Live Orders
              </Link>
            </>
          )}
        </div>
      )}
    </header>
    </>
  );
}
