const PARTNERS = [
  { name: 'GETF', logo: '/brand/partners/getf.png' },
  { name: 'UNDP', logo: '/brand/partners/undp.svg' },
  { name: 'Imani Development', logo: '/brand/partners/imani.png' },
  { name: 'Landell Mills', logo: '/brand/partners/landell-mills.svg' },
  { name: 'Irish Aid', logo: '/brand/partners/ireland.svg' },
];

type Variant = 'light' | 'dark';

export function SiteBrandFooter({ variant = 'light' }: { variant?: Variant }) {
  return (
    <footer className={`site-brand-footer site-brand-footer--${variant}`}>
      <div className="site-brand-gdc">
        <p className="site-brand-kicker">Proud member of</p>
        <img
          src="/brand/gdc-member-stamp.png"
          alt="Global Distributors Collective member"
          className="site-brand-gdc-logo"
        />
      </div>

      <div className="site-brand-partners">
        <p className="site-brand-kicker">Supported by</p>
        <ul className="site-brand-partner-logos">
          {PARTNERS.map((partner) => (
            <li key={partner.name}>
              <img src={partner.logo} alt={partner.name} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export function SiteBrandStrip({ variant = 'light' }: { variant?: Variant }) {
  return (
    <aside
      className={`site-brand-strip site-brand-strip--${variant}`}
      aria-label="Affiliations and supporters"
    >
      <SiteBrandFooter variant={variant} />
    </aside>
  );
}
