const PARTNERS = [
  {
    name: 'GETF Green Economic Transition Facility',
    logo: '/brand/partners/getf.png',
  },
  {
    name: 'UNDP',
    logo: '/brand/partners/undp.svg',
    className: 'h-10 w-[3.5rem] object-contain object-center',
  },
  {
    name: 'Imani Development',
    logo: '/brand/partners/imani.png',
  },
  {
    name: 'Landell Mills',
    logo: '/brand/partners/landell-mills.png',
  },
  {
    name: 'Government of Ireland',
    logo: '/brand/partners/ireland.svg',
  },
];

type Variant = 'light' | 'dark';

const logoHover =
  'origin-center transition-transform duration-200 ease-out hover:scale-110';

const partnerLogoClass = (isDark: boolean, extra?: string) =>
  [
    extra ?? 'max-h-10 max-w-[150px] object-contain',
    logoHover,
    isDark ? 'rounded-lg bg-haroti-paper/95 px-2 py-1' : 'grayscale-[0.05]',
  ]
    .filter(Boolean)
    .join(' ');

export function BrandFooter({ variant = 'dark' }: { variant?: Variant }) {
  const isDark = variant === 'dark';

  return (
    <section
      className={`border-t ${
        isDark
          ? 'border-white/10 bg-[#020f0c] text-white/80'
          : 'border-haroti-mist bg-haroti-paper text-haroti-ink'
      }`}
      aria-label="Affiliations and supporters"
    >
      <div className="container-custom grid gap-6 py-8 md:grid-cols-[auto_1fr] md:items-start">
        <div>
          <p
            className={`mb-3 text-xs font-bold uppercase tracking-widest ${
              isDark ? 'text-white/55' : 'text-haroti-muted'
            }`}
          >
            Proud member of
          </p>
          <img
            src="/brand/gdc-member-stamp.png"
            alt="Global Distributors Collective member"
            className={`block max-h-10 max-w-[150px] object-contain ${logoHover}`}
          />
        </div>

        <div className="min-w-0">
          <p
            className={`mb-3 text-xs font-bold uppercase tracking-widest ${
              isDark ? 'text-white/55' : 'text-haroti-muted'
            }`}
          >
            Supported by
          </p>
          <ul className="flex flex-nowrap items-center gap-x-7 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PARTNERS.map((partner) => (
              <li key={partner.name} className="flex shrink-0 items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  loading="lazy"
                  className={partnerLogoClass(isDark, partner.className)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
