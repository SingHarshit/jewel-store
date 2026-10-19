import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  'Collection': [
    { label: 'All Jewellery', href: '/collections/all' },
    { label: 'Rings', href: '/collections/rings' },
    { label: 'Pendants', href: '/collections/pendants' },
    { label: 'Earrings', href: '/collections/earrings' },
    { label: 'Bracelets', href: '/collections/bracelets' },
  ],
  'Commission': [
    { label: 'Configurator', href: '/configure/signature-5-stone-ring' },
    { label: 'Bespoke', href: '/bespoke' },
    { label: 'Sizing Kit', href: '/sizing-kit' },
  ],
  'Account': [
    { label: 'My Designs', href: '/account?tab=designs' },
    { label: 'My Vault', href: '/account?tab=vault' },
    { label: 'Orders', href: '/account?tab=orders' },
    { label: 'Profile', href: '/account?tab=profile' },
  ],
  'Standards': [
    { label: 'Craftsmanship', href: '/#standards' },
    { label: 'Quality', href: '/#standards' },
    { label: 'Shipping', href: '/#standards' },
    { label: 'Warranty', href: '/#standards' },
  ],
};

export default function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
    >
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-4">
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-ivory)' }}>
                Heirest
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                Fine Jewellery, Authored By You
              </p>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
              Third-generation master jewellers. IGI-certified lab diamonds. D–F colour. 
              8-stage quality control. Lifetime warranty.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="section-label mb-4" style={{ color: 'var(--color-champagne)' }}>{heading}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm transition-opacity hover:opacity-100 opacity-50"
                      style={{ color: 'var(--color-ivory)', fontFamily: 'var(--font-sans)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between pt-6 border-t gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} Heirest Pty Ltd. All rights reserved. ABN 00 000 000 000.
            All prices in AUD unless otherwise indicated.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-[0.6rem] tracking-widest uppercase font-mono opacity-30 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-ivory)' }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
